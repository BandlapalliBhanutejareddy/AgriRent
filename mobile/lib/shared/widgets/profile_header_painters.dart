import 'package:flutter/material.dart';

/// Custom painter for Farmer Profile: Rolling green agricultural hills, farm landscape & sky.
class FarmerLandscapePainter extends CustomPainter {
  final bool isDark;

  FarmerLandscapePainter({this.isDark = false});

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Offset.zero & size;

    // 1. Sky Gradient
    final skyPaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: isDark
            ? [
                const Color(0xFF064E3B),
                const Color(0xFF065F46),
                const Color(0xFF047857),
              ]
            : [
                const Color(0xFFBAE6FD), // Sky blue
                const Color(0xFFE0F2FE), // Horizon soft sky
                const Color(0xFFF0FDF4), // Warm light green tint
              ],
      ).createShader(rect);
    canvas.drawRect(rect, skyPaint);

    // 2. Distant Soft Blue-Green Mountain/Hills
    final distantHillPaint = Paint()
      ..color = (isDark ? const Color(0xFF065F46) : const Color(0xFF86EFAC)).withValues(alpha: isDark ? 0.4 : 0.5)
      ..style = PaintingStyle.fill;

    final distantPath = Path();
    distantPath.moveTo(0, size.height * 0.55);
    distantPath.quadraticBezierTo(
      size.width * 0.25,
      size.height * 0.42,
      size.width * 0.5,
      size.height * 0.52,
    );
    distantPath.quadraticBezierTo(
      size.width * 0.75,
      size.height * 0.62,
      size.width,
      size.height * 0.48,
    );
    distantPath.lineTo(size.width, size.height);
    distantPath.lineTo(0, size.height);
    distantPath.close();
    canvas.drawPath(distantPath, distantHillPaint);

    // 3. Middle Rolling Green Hills
    final midHillPaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: isDark
            ? [const Color(0xFF047857), const Color(0xFF065F46)]
            : [const Color(0xFF4ADE80), const Color(0xFF22C55E)],
      ).createShader(rect);

    final midPath = Path();
    midPath.moveTo(0, size.height * 0.68);
    midPath.quadraticBezierTo(
      size.width * 0.35,
      size.height * 0.56,
      size.width * 0.7,
      size.height * 0.68,
    );
    midPath.quadraticBezierTo(
      size.width * 0.88,
      size.height * 0.73,
      size.width,
      size.height * 0.62,
    );
    midPath.lineTo(size.width, size.height);
    midPath.lineTo(0, size.height);
    midPath.close();
    canvas.drawPath(midPath, midHillPaint);

    // 4. Forefront Lush Farm Fields
    final frontHillPaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: isDark
            ? [const Color(0xFF059669), const Color(0xFF064E3B)]
            : [const Color(0xFF16A34A), const Color(0xFF15803D)],
      ).createShader(rect);

    final frontPath = Path();
    frontPath.moveTo(0, size.height * 0.78);
    frontPath.quadraticBezierTo(
      size.width * 0.22,
      size.height * 0.70,
      size.width * 0.55,
      size.height * 0.82,
    );
    frontPath.quadraticBezierTo(
      size.width * 0.82,
      size.height * 0.92,
      size.width,
      size.height * 0.74,
    );
    frontPath.lineTo(size.width, size.height);
    frontPath.lineTo(0, size.height);
    frontPath.close();
    canvas.drawPath(frontPath, frontHillPaint);

    // 5. Stylized Farm Trees on the right ridge
    final treePaint = Paint()
      ..color = (isDark ? const Color(0xFF022C22) : const Color(0xFF14532D)).withValues(alpha: 0.7)
      ..style = PaintingStyle.fill;

    // Small clusters of trees
    canvas.drawCircle(Offset(size.width * 0.82, size.height * 0.64), 10, treePaint);
    canvas.drawCircle(Offset(size.width * 0.85, size.height * 0.62), 14, treePaint);
    canvas.drawCircle(Offset(size.width * 0.88, size.height * 0.65), 11, treePaint);
    canvas.drawCircle(Offset(size.width * 0.94, size.height * 0.60), 8, treePaint);
  }

  @override
  bool shouldRepaint(covariant FarmerLandscapePainter oldDelegate) => oldDelegate.isDark != isDark;
}

/// Custom painter for Owner Profile: Golden harvest landscape with tractor silhouette.
class HarvestLandscapePainter extends CustomPainter {
  final bool isDark;

  HarvestLandscapePainter({this.isDark = false});

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Offset.zero & size;

    // 1. Golden Sunlit Sky Gradient
    final skyPaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: isDark
            ? [
                const Color(0xFF78350F),
                const Color(0xFF92400E),
                const Color(0xFFB45309),
              ]
            : [
                const Color(0xFFFEF08A), // Warm yellow sun
                const Color(0xFFFDE047), // Golden hue
                const Color(0xFFFED7AA), // Amber horizon
              ],
      ).createShader(rect);
    canvas.drawRect(rect, skyPaint);

    // 2. Distant Amber Hills
    final distantPaint = Paint()
      ..color = (isDark ? const Color(0xFF92400E) : const Color(0xFFFBBF24)).withValues(alpha: isDark ? 0.4 : 0.5)
      ..style = PaintingStyle.fill;

    final distantPath = Path();
    distantPath.moveTo(0, size.height * 0.54);
    distantPath.quadraticBezierTo(
      size.width * 0.3,
      size.height * 0.44,
      size.width * 0.6,
      size.height * 0.55,
    );
    distantPath.quadraticBezierTo(
      size.width * 0.85,
      size.height * 0.64,
      size.width,
      size.height * 0.50,
    );
    distantPath.lineTo(size.width, size.height);
    distantPath.lineTo(0, size.height);
    distantPath.close();
    canvas.drawPath(distantPath, distantPaint);

    // 3. Middle Golden Wheat Ridge
    final midPaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: isDark
            ? [const Color(0xFFB45309), const Color(0xFF92400E)]
            : [const Color(0xFFF59E0B), const Color(0xFFD97706)],
      ).createShader(rect);

    final midPath = Path();
    midPath.moveTo(0, size.height * 0.66);
    midPath.quadraticBezierTo(
      size.width * 0.4,
      size.height * 0.58,
      size.width * 0.75,
      size.height * 0.68,
    );
    midPath.quadraticBezierTo(
      size.width * 0.9,
      size.height * 0.72,
      size.width,
      size.height * 0.64,
    );
    midPath.lineTo(size.width, size.height);
    midPath.lineTo(0, size.height);
    midPath.close();
    canvas.drawPath(midPath, midPaint);

    // 4. Front Rich Amber Field
    final frontPaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: isDark
            ? [const Color(0xFFD97706), const Color(0xFF78350F)]
            : [const Color(0xFFD97706), const Color(0xFFB45309)],
      ).createShader(rect);

    final frontPath = Path();
    frontPath.moveTo(0, size.height * 0.78);
    frontPath.quadraticBezierTo(
      size.width * 0.3,
      size.height * 0.72,
      size.width * 0.65,
      size.height * 0.82,
    );
    frontPath.quadraticBezierTo(
      size.width * 0.85,
      size.height * 0.88,
      size.width,
      size.height * 0.76,
    );
    frontPath.lineTo(size.width, size.height);
    frontPath.lineTo(0, size.height);
    frontPath.close();
    canvas.drawPath(frontPath, frontPaint);

    // 5. Stylized Tractor Illustration on the right
    _drawTractorSilhouette(canvas, size);
  }

  void _drawTractorSilhouette(Canvas canvas, Size size) {
    final tractorPaint = Paint()
      ..color = (isDark ? const Color(0xFF451A03) : const Color(0xFF78350F)).withValues(alpha: 0.85)
      ..style = PaintingStyle.fill;

    final baseX = size.width * 0.76;
    final baseY = size.height * 0.62;

    // Rear large wheel
    canvas.drawCircle(Offset(baseX + 16, baseY + 18), 16, tractorPaint);
    // Front smaller wheel
    canvas.drawCircle(Offset(baseX + 54, baseY + 24), 10, tractorPaint);

    // Cabin / Body
    final bodyPath = Path();
    bodyPath.moveTo(baseX + 4, baseY + 14);
    bodyPath.lineTo(baseX + 10, baseY - 8); // Cabin roof back
    bodyPath.lineTo(baseX + 32, baseY - 8); // Cabin roof front
    bodyPath.lineTo(baseX + 34, baseY + 6); // Windshield
    bodyPath.lineTo(baseX + 58, baseY + 8); // Hood
    bodyPath.lineTo(baseX + 58, baseY + 20); // Front grill
    bodyPath.lineTo(baseX + 42, baseY + 20);
    bodyPath.lineTo(baseX + 32, baseY + 16);
    bodyPath.lineTo(baseX + 4, baseY + 16);
    bodyPath.close();
    canvas.drawPath(bodyPath, tractorPaint);

    // Exhaust pipe
    final exhaustPaint = Paint()
      ..color = tractorPaint.color
      ..strokeWidth = 2.5
      ..style = PaintingStyle.stroke;
    canvas.drawLine(Offset(baseX + 44, baseY + 8), Offset(baseX + 44, baseY - 4), exhaustPaint);
  }

  @override
  bool shouldRepaint(covariant HarvestLandscapePainter oldDelegate) => oldDelegate.isDark != isDark;
}

/// Custom painter for Admin Profile: Royal blue glowing waves and curves backdrop.
class AdminWavesPainter extends CustomPainter {
  final bool isDark;

  AdminWavesPainter({this.isDark = false});

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Offset.zero & size;

    // 1. Royal Blue Gradient Background
    final bgPaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: isDark
            ? [
                const Color(0xFF0F172A),
                const Color(0xFF1E3A8A),
                const Color(0xFF1D4ED8),
              ]
            : [
                const Color(0xFF1E40AF), // Deep Royal Blue
                const Color(0xFF2563EB), // Vibrant Blue
                const Color(0xFF3B82F6), // Bright Azure Blue
              ],
      ).createShader(rect);
    canvas.drawRect(rect, bgPaint);

    // 2. Translucent Wave 1 (Light blue)
    final wave1Paint = Paint()
      ..color = Colors.white.withValues(alpha: isDark ? 0.08 : 0.16)
      ..style = PaintingStyle.fill;

    final path1 = Path();
    path1.moveTo(0, size.height * 0.45);
    path1.cubicTo(
      size.width * 0.25,
      size.height * 0.25,
      size.width * 0.65,
      size.height * 0.75,
      size.width,
      size.height * 0.40,
    );
    path1.lineTo(size.width, size.height);
    path1.lineTo(0, size.height);
    path1.close();
    canvas.drawPath(path1, wave1Paint);

    // 3. Translucent Wave 2 (Azure)
    final wave2Paint = Paint()
      ..color = const Color(0xFF93C5FD).withValues(alpha: isDark ? 0.12 : 0.22)
      ..style = PaintingStyle.fill;

    final path2 = Path();
    path2.moveTo(0, size.height * 0.65);
    path2.cubicTo(
      size.width * 0.35,
      size.height * 0.85,
      size.width * 0.70,
      size.height * 0.45,
      size.width,
      size.height * 0.68,
    );
    path2.lineTo(size.width, size.height);
    path2.lineTo(0, size.height);
    path2.close();
    canvas.drawPath(path2, wave2Paint);

    // 4. Subtle Digital Grid dots in top-right
    final dotPaint = Paint()
      ..color = Colors.white.withValues(alpha: isDark ? 0.06 : 0.12)
      ..style = PaintingStyle.fill;

    for (int i = 0; i < 4; i++) {
      for (int j = 0; j < 5; j++) {
        canvas.drawCircle(
          Offset(size.width * 0.75 + (j * 14), size.height * 0.15 + (i * 14)),
          1.8,
          dotPaint,
        );
      }
    }
  }

  @override
  bool shouldRepaint(covariant AdminWavesPainter oldDelegate) => oldDelegate.isDark != isDark;
}
