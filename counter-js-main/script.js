let timer;
  let startTime;
  let elapsed = 0;

  function updateDisplay() {
    const time = new Date(elapsed);
    const hrs = String(time.getUTCHours()).padStart(2, '0');
    const mins = String(time.getUTCMinutes()).padStart(2, '0');
    const secs = String(time.getUTCSeconds()).padStart(2, '0');
    const ms = String(time.getUTCMilliseconds()).padStart(3, '0');
    document.getElementById('display').textContent = `${hrs}:${mins}:${secs}.${ms}`;
  }

  function start() {
    if (!timer) {
      startTime = Date.now() - elapsed;
      timer = setInterval(() => {
        elapsed = Date.now() - startTime;
        updateDisplay();
      }, 10); // 10ms hassasiyet
    }
  }

  function stop() {
    clearInterval(timer);
    timer = null;
  }

  function reset() {
    stop();
    elapsed = 0;
    updateDisplay();
  }
