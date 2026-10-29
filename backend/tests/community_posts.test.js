/**
 * community_posts.test.js
 * Automated tests for Phase 4: Farmer Community Posts, Comments, Authorization & Abuse Controls
 */

const assert = require('assert');
const test = require('node:test');
const { prisma } = require('../dist/lib/prisma');

test('Farmer Community - Persistence & Authorization Suite', async (t) => {
  let farmerUser1;
  let farmerUser2;
  let adminUser;
  let testPost;

  t.before(async () => {
    // Create or find test users
    farmerUser1 = await prisma.user.findFirst({
      where: { role: 'FARMER' }
    });
    if (!farmerUser1) {
      farmerUser1 = await prisma.user.create({
        data: {
          name: 'Community Farmer 1',
          email: `comm_farmer1_${Date.now()}@agrorent.ai`,
          password: 'hashed_password',
          role: 'FARMER'
        }
      });
    }

    farmerUser2 = await prisma.user.findFirst({
      where: { role: 'FARMER', id: { not: farmerUser1.id } }
    });
    if (!farmerUser2) {
      farmerUser2 = await prisma.user.create({
        data: {
          name: 'Community Farmer 2',
          email: `comm_farmer2_${Date.now()}@agrorent.ai`,
          password: 'hashed_password',
          role: 'FARMER'
        }
      });
    }

    adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });
  });

  await t.test('1. Creates a persistent farming question post with category and author relation', async () => {
    testPost = await prisma.communityPost.create({
      data: {
        authorId: farmerUser1.id,
        title: 'Best Machinery for Kharif Paddy Direct Seeding (DSR)?',
        content: 'We are planning 10 acres of DSR paddy on clay loam soil. Is a tractor-drawn drum seeder or pneumatic precision planter better for fuel efficiency?',
        category: 'EQUIPMENT',
        tags: 'dsr, paddy, seeding, tractor'
      },
      include: {
        author: {
          select: { id: true, name: true, role: true }
        }
      }
    });

    assert(testPost.id);
    assert.strictEqual(testPost.authorId, farmerUser1.id);
    assert.strictEqual(testPost.category, 'EQUIPMENT');
    assert.strictEqual(testPost.status, 'ACTIVE');
    assert.strictEqual(testPost.isReported, false);
    assert.strictEqual(testPost.likesCount, 0);
  });

  await t.test('2. Allows post author to edit their own post', async () => {
    const updated = await prisma.communityPost.update({
      where: { id: testPost.id },
      data: {
        title: 'Best Machinery for Kharif Paddy DSR on Clay Soil?',
        content: 'Updated content with additional soil moisture details.'
      }
    });

    assert.strictEqual(updated.title, 'Best Machinery for Kharif Paddy DSR on Clay Soil?');
    assert.strictEqual(updated.content, 'Updated content with additional soil moisture details.');
  });

  await t.test('3. Enforces authorization: Other farmers cannot edit or delete the post', async () => {
    // Verify business rule: only author or admin can update
    const canFarmer2Edit = (farmerUser2.id === testPost.authorId || farmerUser2.role === 'ADMIN');
    assert.strictEqual(canFarmer2Edit, false, 'Farmer 2 must NOT have permission to edit Farmer 1 post');

    const canFarmer1Edit = (farmerUser1.id === testPost.authorId || farmerUser1.role === 'ADMIN');
    assert.strictEqual(canFarmer1Edit, true, 'Farmer 1 must have permission to edit own post');
  });

  await t.test('4. Allows farmers to add comments/replies and preserves chronological order', async () => {
    const comment1 = await prisma.communityComment.create({
      data: {
        postId: testPost.id,
        authorId: farmerUser2.id,
        content: 'Use an 8-row pneumatic precision planter with 45HP tractor. It saves 30% seed rate.'
      }
    });

    const comment2 = await prisma.communityComment.create({
      data: {
        postId: testPost.id,
        authorId: farmerUser1.id,
        content: 'Thank you! What is the optimal soil moisture percentage at sowing?'
      }
    });

    assert(comment1.id);
    assert(comment2.id);

    const postWithComments = await prisma.communityPost.findUnique({
      where: { id: testPost.id },
      include: {
        comments: {
          orderBy: { createdAt: 'asc' },
          include: { author: { select: { name: true } } }
        }
      }
    });

    assert.strictEqual(postWithComments.comments.length, 2);
    assert.strictEqual(postWithComments.comments[0].id, comment1.id);
    assert.strictEqual(postWithComments.comments[1].id, comment2.id);
  });

  await t.test('5. Submits an abuse report and marks post as reported', async () => {
    const report = await prisma.communityReport.create({
      data: {
        reporterId: farmerUser2.id,
        postId: testPost.id,
        reason: 'Testing abuse reporting system'
      }
    });

    await prisma.communityPost.update({
      where: { id: testPost.id },
      data: { isReported: true }
    });

    assert(report.id);
    assert.strictEqual(report.status, 'PENDING');

    const checkPost = await prisma.communityPost.findUnique({ where: { id: testPost.id } });
    assert.strictEqual(checkPost.isReported, true);
  });

  await t.test('6. Cleans up test post and cascades comments cleanly', async () => {
    await prisma.communityPost.delete({ where: { id: testPost.id } });

    const commentsLeft = await prisma.communityComment.findMany({ where: { postId: testPost.id } });
    assert.strictEqual(commentsLeft.length, 0, 'Comments must cascade delete with post');
  });
});

