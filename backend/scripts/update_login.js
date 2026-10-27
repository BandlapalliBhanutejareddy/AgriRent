const fs = require('fs');
const file = '../mobile/lib/features/auth/ui/login_screen.dart';
let c = fs.readFileSync(file, 'utf8');
c = c.replace("final _emailController = TextEditingController(text: 'farmer@example.com');", "final _emailController = TextEditingController(text: 'farmer.live@agrorent.ai');");
c = c.replace("final _passwordController = TextEditingController();", "final _passwordController = TextEditingController(text: 'Password123!');");
c = c.replace("onTap: () => setState(() => _selectedRole = 'FARMER'),", "onTap: () { ref.read(authProvider.notifier).clearError(); setState(() { _selectedRole = 'FARMER'; _emailController.text = 'farmer.live@agrorent.ai'; _passwordController.text = 'Password123!'; }); },");
c = c.replace("onTap: () => setState(() => _selectedRole = 'OWNER'),", "onTap: () { ref.read(authProvider.notifier).clearError(); setState(() { _selectedRole = 'OWNER'; _emailController.text = 'owner.live@agrorent.ai'; _passwordController.text = 'Password123!'; }); },");
fs.writeFileSync(file, c, 'utf8');
console.log('Updated successfully');
