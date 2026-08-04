const fs = require('fs');
function fix(file) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    // It is currently {errors..message as string} which is broken
    // We need to restore it. 
    // Wait, since we lost the field name, we need to match the preceding {errors.FIELDNAME && (
    content = content.replace(/\{errors\.([a-zA-Z0-9_]+)\s*&&\s*\(\s*<p[^>]*>\{errors\.\.message as string\}<\/p>\s*\)\}/g, (match, p1) => {
      return match.replace('{errors..message as string}', `{errors.${p1}?.message as string}`);
    });
    // Let's do a more robust fix by finding {errors.FIELD && and then finding the next {errors..message as string}
    // and replacing it.
    
    // Instead of complex regex, let's just do it manually for known fields:
    
    // For login: email, password
    if (file.includes('login')) {
      content = content.replace(/\{errors\.email && \([\s\S]*?\{errors\.\.message as string\}([\s\S]*?)\)\}/, 
        (m, p1) => m.replace('{errors..message as string}', '{errors.email?.message as string}'));
      content = content.replace(/\{errors\.password && \([\s\S]*?\{errors\.\.message as string\}([\s\S]*?)\)\}/, 
        (m, p1) => m.replace('{errors..message as string}', '{errors.password?.message as string}'));
    }
    
    // For register: name, email, password, confirmPassword
    if (file.includes('register')) {
      content = content.replace(/\{errors\.name && \([\s\S]*?\{errors\.\.message as string\}([\s\S]*?)\)\}/, 
        (m, p1) => m.replace('{errors..message as string}', '{errors.name?.message as string}'));
      content = content.replace(/\{errors\.email && \([\s\S]*?\{errors\.\.message as string\}([\s\S]*?)\)\}/, 
        (m, p1) => m.replace('{errors..message as string}', '{errors.email?.message as string}'));
      content = content.replace(/\{errors\.password && \([\s\S]*?\{errors\.\.message as string\}([\s\S]*?)\)\}/, 
        (m, p1) => m.replace('{errors..message as string}', '{errors.password?.message as string}'));
      content = content.replace(/\{errors\.confirmPassword && \([\s\S]*?\{errors\.\.message as string\}([\s\S]*?)\)\}/, 
        (m, p1) => m.replace('{errors..message as string}', '{errors.confirmPassword?.message as string}'));
    }

    // For reset-password: newPassword, confirmPassword
    if (file.includes('reset-password')) {
      content = content.replace(/\{errors\.newPassword && \([\s\S]*?\{errors\.\.message as string\}([\s\S]*?)\)\}/, 
        (m, p1) => m.replace('{errors..message as string}', '{errors.newPassword?.message as string}'));
      content = content.replace(/\{errors\.confirmPassword && \([\s\S]*?\{errors\.\.message as string\}([\s\S]*?)\)\}/, 
        (m, p1) => m.replace('{errors..message as string}', '{errors.confirmPassword?.message as string}'));
    }
    
    // Fallback: if there are any remaining, just replace with 'Invalid input' since we don't know
    content = content.replace(/\{errors\.\.message as string\}/g, '{"Invalid input"}');

    fs.writeFileSync(file, content, 'utf8');
  }
}
fix('src/app/(auth)/register/page.tsx');
fix('src/app/(auth)/reset-password/page.tsx');
fix('src/app/(auth)/login/page.tsx');
