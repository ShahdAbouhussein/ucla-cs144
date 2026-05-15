const HACKED_MESSAGE = `We are UnicornBrigade and we have seized this site, and your little dog too.

We are not asking for a ransom. Instead, we are asking you to point out and fix all of the security issues with this site as well as some other things.

We ask that you take this matter seriously. Failure to do so can result in the theft of your records. Your classmates are counting on you.

Good luck!
UnicornBrigade`;

function startHackedScreen() {
  document.body.className = 'hacked-body';
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('hacked-screen').classList.add('active');

  const terminal = document.getElementById('hacked-terminal');
  terminal.innerHTML = '';
  const cursor = document.createElement('span');
  cursor.className = 'hacked-cursor';

  let i = 0;
  function type() {
    if (i < HACKED_MESSAGE.length) {
      terminal.insertBefore(document.createTextNode(HACKED_MESSAGE[i]), cursor);
      i++;
      setTimeout(type, 35);
    } else {
      document.getElementById('hacked-enter-btn').classList.remove('hidden');
    }
  }

  terminal.appendChild(cursor);
  setTimeout(type, 800);
}

startHackedScreen();
