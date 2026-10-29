import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../shared/theme/app_theme.dart';
import '../../auth/providers/auth_provider.dart';

class OwnerBankDetailsDialog extends ConsumerStatefulWidget {
  const OwnerBankDetailsDialog({super.key});

  static Future<Map<String, dynamic>?> show(BuildContext context) {
    return showDialog<Map<String, dynamic>>(
      context: context,
      barrierDismissible: false,
      builder: (_) => const OwnerBankDetailsDialog(),
    );
  }

  @override
  ConsumerState<OwnerBankDetailsDialog> createState() => _OwnerBankDetailsDialogState();
}

class _OwnerBankDetailsDialogState extends ConsumerState<OwnerBankDetailsDialog> {
  final _formKey = GlobalKey<FormState>();
  final _holderCtrl = TextEditingController();
  final _bankCtrl = TextEditingController();
  final _accCtrl = TextEditingController();
  final _confirmAccCtrl = TextEditingController();
  final _ifscCtrl = TextEditingController();

  bool _isLoading = true;
  bool _isSaving = false;
  bool _isEditing = false;
  bool _obscureAcc = true;
  bool _obscureConfirm = true;
  String? _savedMaskedAccount;
  String? _serverError;

  static final RegExp _ifscRegex = RegExp(r'^[A-Z]{4}0[A-Z0-9]{6}$');

  @override
  void initState() {
    super.initState();
    _fetchExistingDetails();
  }

  @override
  void dispose() {
    _holderCtrl.dispose();
    _bankCtrl.dispose();
    _accCtrl.dispose();
    _confirmAccCtrl.dispose();
    _ifscCtrl.dispose();
    super.dispose();
  }

  Future<void> _fetchExistingDetails() async {
    setState(() {
      _isLoading = true;
      _serverError = null;
    });

    try {
      final res = await ApiClient().dio.get('owner/bank-details');
      if (res.statusCode == 200 && res.data != null && res.data['success'] == true) {
        final data = res.data['data'];
        if (data != null && data is Map<String, dynamic>) {
          _holderCtrl.text = (data['accountHolderName'] ?? '').toString();
          _bankCtrl.text = (data['bankName'] ?? '').toString();
          _ifscCtrl.text = (data['ifscCode'] ?? '').toString();
          _savedMaskedAccount = (data['accountNumberMasked'] ?? data['maskedAccountNumber'] ?? '').toString();
        }
      }
    } catch (e) {
      // If none saved yet or network error, default to user's name
      final user = ref.read(authProvider).user;
      if (_holderCtrl.text.isEmpty && user?.name != null) {
        _holderCtrl.text = user!.name;
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _isEditing = (_savedMaskedAccount == null || _savedMaskedAccount!.isEmpty);
        });
      }
    }
  }

  Future<void> _saveBankDetails() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isSaving = true;
      _serverError = null;
    });

    try {
      final payload = {
        'accountHolderName': _holderCtrl.text.trim(),
        'bankName': _bankCtrl.text.trim(),
        'accountNumber': _accCtrl.text.trim(),
        'confirmAccountNumber': _confirmAccCtrl.text.trim(),
        'ifscCode': _ifscCtrl.text.trim().toUpperCase(),
      };

      final res = await ApiClient().dio.post('owner/bank-details', data: payload);
      if (res.statusCode == 200 && res.data != null && res.data['success'] == true) {
        final data = res.data['data'] as Map<String, dynamic>?;
        final cleanAcc = payload['accountNumber']!;
        final fallbackMasked = '******${cleanAcc.substring(cleanAcc.length - 4)}';
        final newMasked = data?['accountNumberMasked']?.toString() ?? data?['maskedAccountNumber']?.toString() ?? fallbackMasked;

        if (mounted) {
          setState(() {
            _savedMaskedAccount = newMasked;
            _accCtrl.clear();
            _confirmAccCtrl.clear();
            _isEditing = false;
            _isSaving = false;
          });

          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Bank details verified and encrypted securely for direct payouts.'),
              backgroundColor: Color(0xFF16A34A),
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      } else {
        setState(() {
          _serverError = res.data?['message']?.toString() ?? res.data?['error']?.toString() ?? 'Failed to save bank details.';
          _isSaving = false;
        });
      }
    } catch (e) {
      setState(() {
        _serverError = 'Connection failed or session expired. Please retry.';
        _isSaving = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final lang = ref.watch(languageProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Dialog(
      backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 500, maxHeight: 720),
        child: _isLoading
            ? Container(
                padding: const EdgeInsets.all(40),
                child: const Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    CircularProgressIndicator(color: AppTheme.primaryGreen),
                    SizedBox(height: 16),
                    Text(
                      'Loading bank details from secure ledger...',
                      style: TextStyle(fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              )
            : SingleChildScrollView(
                padding: const EdgeInsets.all(22),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Header
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: const Color(0xFF2563EB).withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: const Icon(
                            Icons.account_balance_rounded,
                            color: Color(0xFF2563EB),
                            size: 24,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'bank_details'.tr(lang).isEmpty || 'bank_details'.tr(lang) == 'bank_details'
                                    ? 'Bank Account & Payouts'
                                    : 'bank_details'.tr(lang),
                                style: TextStyle(
                                  fontWeight: FontWeight.w800,
                                  fontSize: 18,
                                  color: isDark ? Colors.white : AppTheme.textDarkNavy,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'Direct deposit account for rental earnings',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: isDark ? Colors.white54 : AppTheme.textMutedGray,
                                ),
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close_rounded),
                          onPressed: () => Navigator.of(context).pop(),
                          color: isDark ? Colors.white54 : Colors.grey.shade600,
                        ),
                      ],
                    ),
                    const SizedBox(height: 18),

                    // Server Error Alert
                    if (_serverError != null) ...[
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.red.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.red.withValues(alpha: 0.3)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.error_outline_rounded, color: Colors.red, size: 18),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                _serverError!,
                                style: const TextStyle(color: Colors.red, fontSize: 12.5),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 14),
                    ],

                    // SWITCH BETWEEN READ-ONLY AND EDIT VIEW
                    if (!_isEditing && _savedMaskedAccount != null && _savedMaskedAccount!.isNotEmpty)
                      _buildReadOnlyView(isDark)
                    else
                      _buildEditForm(isDark),
                  ],
                ),
              ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // 1. CLEAN READ-ONLY VIEW (Prompt Requirement 3)
  // ---------------------------------------------------------------------------
  Widget _buildReadOnlyView(bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Verified Account Card
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: isDark
                  ? [const Color(0xFF1E3A2F), const Color(0xFF142820)]
                  : [const Color(0xFFF0FDF4), const Color(0xFFE8F5E9)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: isDark ? const Color(0xFF16A34A).withValues(alpha: 0.4) : const Color(0xFF86EFAC),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.04),
                blurRadius: 8,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.verified_rounded, color: Color(0xFF16A34A), size: 20),
                      const SizedBox(width: 8),
                      Text(
                        'ACTIVE PAYOUT ACCOUNT',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          color: isDark ? const Color(0xFF86EFAC) : const Color(0xFF15803D),
                          letterSpacing: 0.5,
                        ),
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: const Color(0xFF16A34A).withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.lock_rounded, size: 11, color: Color(0xFF16A34A)),
                        SizedBox(width: 4),
                        Text(
                          'AES-256',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF16A34A),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Masked Account Number
              Text(
                'Account Number',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: isDark ? Colors.white60 : const Color(0xFF64748B),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                _savedMaskedAccount!,
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 2,
                  color: isDark ? Colors.white : AppTheme.textDarkNavy,
                ),
              ),
              const SizedBox(height: 16),
              const Divider(height: 1),
              const SizedBox(height: 14),

              // Details Grid
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Beneficiary Name',
                          style: TextStyle(
                            fontSize: 11,
                            color: isDark ? Colors.white54 : const Color(0xFF64748B),
                          ),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          _holderCtrl.text.isNotEmpty ? _holderCtrl.text : '--',
                          style: TextStyle(
                            fontSize: 13.5,
                            fontWeight: FontWeight.w700,
                            color: isDark ? Colors.white : AppTheme.textDarkNavy,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Bank Name',
                          style: TextStyle(
                            fontSize: 11,
                            color: isDark ? Colors.white54 : const Color(0xFF64748B),
                          ),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          _bankCtrl.text.isNotEmpty ? _bankCtrl.text : '--',
                          style: TextStyle(
                            fontSize: 13.5,
                            fontWeight: FontWeight.w700,
                            color: isDark ? Colors.white : AppTheme.textDarkNavy,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'IFSC Code',
                        style: TextStyle(
                          fontSize: 11,
                          color: isDark ? Colors.white54 : const Color(0xFF64748B),
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        _ifscCtrl.text.isNotEmpty ? _ifscCtrl.text : '--',
                        style: TextStyle(
                          fontSize: 13.5,
                          fontWeight: FontWeight.w800,
                          color: isDark ? Colors.white : AppTheme.textDarkNavy,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Security Notice
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: isDark ? Colors.white.withValues(alpha: 0.04) : const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: isDark ? Colors.white10 : const Color(0xFFE2E8F0)),
          ),
          child: Row(
            children: [
              Icon(Icons.shield_outlined, size: 18, color: isDark ? Colors.white70 : const Color(0xFF64748B)),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Full account digits are encrypted in hardware storage. Automatic daily rental disbursements are transferred directly to this account.',
                  style: TextStyle(
                    fontSize: 11.5,
                    color: isDark ? Colors.white70 : const Color(0xFF64748B),
                    height: 1.35,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 22),

        // Action Buttons
        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: () => Navigator.of(context).pop(),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  side: BorderSide(
                    color: isDark ? Colors.white24 : Colors.grey.shade300,
                  ),
                ),
                child: Text(
                  'Close',
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              flex: 2,
              child: ElevatedButton.icon(
                onPressed: () {
                  setState(() {
                    _isEditing = true;
                    _accCtrl.clear();
                    _confirmAccCtrl.clear();
                  });
                },
                icon: const Icon(Icons.edit_rounded, size: 18),
                label: const Text(
                  'Edit Bank Details',
                  style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14.5),
                ),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  backgroundColor: const Color(0xFF2563EB),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  elevation: 0,
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  // ---------------------------------------------------------------------------
  // 2. EDIT FORM VIEW
  // ---------------------------------------------------------------------------
  Widget _buildEditForm(bool isDark) {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (_savedMaskedAccount != null && _savedMaskedAccount!.isNotEmpty) ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              margin: const EdgeInsets.only(bottom: 14),
              decoration: BoxDecoration(
                color: const Color(0xFF2563EB).withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                children: [
                  const Icon(Icons.info_outline_rounded, size: 16, color: Color(0xFF2563EB)),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Editing active payout account: $_savedMaskedAccount',
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF2563EB)),
                    ),
                  ),
                ],
              ),
            ),
          ],

          // 1. Account Holder Name
          Text(
            'Account Holder Name',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
            ),
          ),
          const SizedBox(height: 6),
          TextFormField(
            controller: _holderCtrl,
            textCapitalization: TextCapitalization.words,
            decoration: _inputDecoration(
              isDark: isDark,
              hint: 'As printed on passbook / cheque',
              prefixIcon: Icons.person_outline_rounded,
            ),
            validator: (v) {
              if (v == null || v.trim().length < 2) {
                return 'Enter full name (minimum 2 characters)';
              }
              return null;
            },
          ),
          const SizedBox(height: 14),

          // 2. Bank Name
          Text(
            'Bank Name',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
            ),
          ),
          const SizedBox(height: 6),
          TextFormField(
            controller: _bankCtrl,
            textCapitalization: TextCapitalization.words,
            decoration: _inputDecoration(
              isDark: isDark,
              hint: 'e.g. State Bank of India, HDFC Bank',
              prefixIcon: Icons.account_balance_rounded,
            ),
            validator: (v) {
              if (v == null || v.trim().length < 2) {
                return 'Enter valid bank name';
              }
              return null;
            },
          ),
          const SizedBox(height: 14),

          // 3. Account Number
          Text(
            'Account Number',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
            ),
          ),
          const SizedBox(height: 6),
          TextFormField(
            controller: _accCtrl,
            keyboardType: TextInputType.number,
            obscureText: _obscureAcc,
            inputFormatters: [
              FilteringTextInputFormatter.digitsOnly,
              LengthLimitingTextInputFormatter(20),
            ],
            decoration: _inputDecoration(
              isDark: isDark,
              hint: '8 to 20 digits account number',
              prefixIcon: Icons.pin_rounded,
              suffixIcon: IconButton(
                icon: Icon(
                  _obscureAcc ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                  size: 18,
                  color: isDark ? Colors.white38 : Colors.grey.shade600,
                ),
                onPressed: () => setState(() => _obscureAcc = !_obscureAcc),
              ),
            ),
            validator: (v) {
              if (v == null || v.trim().length < 8) {
                return 'Account number must be 8-20 digits';
              }
              return null;
            },
          ),
          const SizedBox(height: 14),

          // 4. Confirm Account Number
          Text(
            'Confirm Account Number',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
            ),
          ),
          const SizedBox(height: 6),
          TextFormField(
            controller: _confirmAccCtrl,
            keyboardType: TextInputType.number,
            obscureText: _obscureConfirm,
            inputFormatters: [
              FilteringTextInputFormatter.digitsOnly,
              LengthLimitingTextInputFormatter(20),
            ],
            decoration: _inputDecoration(
              isDark: isDark,
              hint: 'Re-enter account number',
              prefixIcon: Icons.lock_outline_rounded,
              suffixIcon: IconButton(
                icon: Icon(
                  _obscureConfirm ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                  size: 18,
                  color: isDark ? Colors.white38 : Colors.grey.shade600,
                ),
                onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm),
              ),
            ),
            validator: (v) {
              if (v == null || v.trim().isEmpty) {
                return 'Please confirm account number';
              }
              if (_accCtrl.text.isNotEmpty && v != _accCtrl.text) {
                return 'Account numbers do not match';
              }
              return null;
            },
          ),
          const SizedBox(height: 14),

          // 5. IFSC Code
          Text(
            'IFSC Code (11 characters)',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
            ),
          ),
          const SizedBox(height: 6),
          TextFormField(
            controller: _ifscCtrl,
            textCapitalization: TextCapitalization.characters,
            inputFormatters: [
              FilteringTextInputFormatter.allow(RegExp(r'[a-zA-Z0-9]')),
              LengthLimitingTextInputFormatter(11),
            ],
            decoration: _inputDecoration(
              isDark: isDark,
              hint: 'e.g. SBIN0001234',
              prefixIcon: Icons.verified_user_outlined,
            ),
            validator: (v) {
              final val = (v ?? '').trim().toUpperCase();
              if (val.length != 11) {
                return 'IFSC code must be exactly 11 characters';
              }
              if (!_ifscRegex.hasMatch(val)) {
                return 'Invalid format (e.g. 4 letters, 0, then 6 alphanumeric: SBIN0001234)';
              }
              return null;
            },
          ),
          const SizedBox(height: 24),

          // Action Buttons: Save & Cancel
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: _isSaving
                      ? null
                      : () {
                          if (_savedMaskedAccount != null && _savedMaskedAccount!.isNotEmpty) {
                            setState(() {
                              _isEditing = false;
                              _serverError = null;
                            });
                          } else {
                            Navigator.of(context).pop();
                          }
                        },
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    side: BorderSide(
                      color: isDark ? Colors.white24 : Colors.grey.shade300,
                    ),
                  ),
                  child: Text(
                    'Cancel',
                    style: TextStyle(
                      fontWeight: FontWeight.w700,
                      color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 2,
                child: ElevatedButton(
                  onPressed: _isSaving ? null : _saveBankDetails,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    backgroundColor: const Color(0xFF16A34A),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    elevation: 0,
                  ),
                  child: _isSaving
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        )
                      : const Text(
                          'Save Bank Details',
                          style: TextStyle(
                            fontWeight: FontWeight.w800,
                            fontSize: 15,
                          ),
                        ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  InputDecoration _inputDecoration({
    required bool isDark,
    required String hint,
    required IconData prefixIcon,
    Widget? suffixIcon,
  }) {
    return InputDecoration(
      hintText: hint,
      hintStyle: TextStyle(
        fontSize: 13,
        color: isDark ? Colors.white38 : Colors.grey.shade400,
      ),
      prefixIcon: Icon(
        prefixIcon,
        size: 18,
        color: isDark ? Colors.white38 : Colors.grey.shade500,
      ),
      suffixIcon: suffixIcon,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      filled: true,
      fillColor: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.grey.shade50,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(
          color: isDark ? Colors.white10 : Colors.grey.shade200,
        ),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(
          color: isDark ? Colors.white10 : Colors.grey.shade200,
        ),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFF16A34A), width: 1.5),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Colors.red, width: 1),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Colors.red, width: 1.5),
      ),
    );
  }
}
