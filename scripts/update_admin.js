const fs = require('fs');
let content = fs.readFileSync('d:/AgriRent_AI/mobile/lib/features/admin/ui/admin_dashboard_screen.dart', 'utf8');

if (!content.includes("package:go_router/go_router.dart")) {
  content = "import 'package:go_router/go_router.dart';\n" + content;
}

const target = "actions: [";
const replacement = `actions: [
          IconButton(
            icon: CircleAvatar(
              radius: 14,
              backgroundColor: AppTheme.primaryGreen.withValues(alpha: 0.15),
              backgroundImage: (user?.profileImage != null && user!.profileImage!.isNotEmpty)
                  ? NetworkImage(user.profileImage!)
                  : null,
              child: (user?.profileImage == null || user!.profileImage!.isEmpty)
                  ? Text(
                      (user?.name.isNotEmpty == true ? user!.name[0] : 'A').toUpperCase(),
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.primaryGreen),
                    )
                  : null,
            ),
            tooltip: 'Profile',
            onPressed: () => context.push('/edit-profile'),
          ),`;

if (content.includes(target) && !content.includes("tooltip: 'Profile'")) {
  content = content.replace(target, replacement);
  fs.writeFileSync('d:/AgriRent_AI/mobile/lib/features/admin/ui/admin_dashboard_screen.dart', content, 'utf8');
  console.log('Successfully updated admin_dashboard_screen.dart');
} else {
  console.log('Already updated or target not found');
}
