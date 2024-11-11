document.getElementById("select-folder").addEventListener("click", async () => {
  const audioFiles = await window.electronAPI.selectFolder();
  if (!audioFiles) return;

  const audioList = document.getElementById("audio-list");
  audioList.innerHTML = "";

  audioFiles.forEach((filePath, index) => {
    const container = document.createElement("div");
    container.classList.add("audio-item");

    const fileName = filePath.split(/[/\\]/).pop();
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    const audio = new Audio(filePath);
    const sourceNode = audioContext.createMediaElementSource(audio);

    sourceNode.connect(audioContext.destination);

    // リバーブ用ノード（Convolver）
    const reverbNode = audioContext.createConvolver();
    reverbNode.buffer = generateImpulseResponse(audioContext, 1, 2);

    // ディレイノード
    const delayNode = audioContext.createDelay();
    delayNode.delayTime.value = 0;

    // エコー用のフィードバックゲインノード
    const feedbackGainNode = audioContext.createGain();
    feedbackGainNode.gain.value = 0;
    delayNode.connect(feedbackGainNode);
    feedbackGainNode.connect(delayNode);

    // エフェクトのオンオフ状態を管理するチェックボックス
    const reverbCheckbox = document.createElement("input");
    reverbCheckbox.type = "checkbox";
    reverbCheckbox.addEventListener("change", updateConnections);

    const delayCheckbox = document.createElement("input");
    delayCheckbox.type = "checkbox";
    delayCheckbox.addEventListener("change", updateConnections);

    const echoCheckbox = document.createElement("input");
    echoCheckbox.type = "checkbox";
    echoCheckbox.addEventListener("change", updateConnections);

    // ラベルを追加
    const reverbLabel = document.createElement("label");
    reverbLabel.textContent = "Reverb";
    reverbLabel.appendChild(reverbCheckbox);

    const delayLabel = document.createElement("label");
    delayLabel.textContent = "Delay";
    delayLabel.appendChild(delayCheckbox);

    const echoLabel = document.createElement("label");
    echoLabel.textContent = "Echo";
    echoLabel.appendChild(echoCheckbox);

    // 表示名の入力フィールド
    const displayNameInput = document.createElement("input");
    displayNameInput.type = "text";
    displayNameInput.value = fileName;
    displayNameInput.classList.add("display-name");

    // 再生・一時停止トグルスイッチ
    const toggleSwitchContainer = document.createElement("label");
    toggleSwitchContainer.classList.add("toggle-switch");

    const toggleSwitch = document.createElement("input");
    toggleSwitch.type = "checkbox";
    toggleSwitchContainer.appendChild(toggleSwitch);

    const slider = document.createElement("span");
    slider.classList.add("slider");
    toggleSwitchContainer.appendChild(slider);

    // トグルスイッチの再生・一時停止機能
    toggleSwitch.addEventListener("change", () => {
      if (toggleSwitch.checked) {
        audioContext.resume().then(() => {
          audio.play();
        });
        container.classList.add("playing");
      } else {
        audio.pause();
        container.classList.remove("playing");
      }
    });

    // 音量調整スライダー
    const volumeSlider = document.createElement("input");
    volumeSlider.type = "range";
    volumeSlider.min = 0;
    volumeSlider.max = 1;
    volumeSlider.step = 0.01;
    volumeSlider.value = audio.volume;
    volumeSlider.addEventListener("input", () => {
      audio.volume = volumeSlider.value;
    });

    // シークバー
    const seekBar = document.createElement("input");
    seekBar.type = "range";
    seekBar.min = 0;
    seekBar.value = 0;
    seekBar.classList.add("seek-bar");
    const timeDisplay = document.createElement("span");
    timeDisplay.classList.add("time-display");
    timeDisplay.textContent = "0:00 / 0:00";

    audio.addEventListener("loadedmetadata", () => {
      seekBar.max = audio.duration;
      updateDisplayTime();
    });

    audio.addEventListener("timeupdate", () => {
      seekBar.value = audio.currentTime;
      updateDisplayTime();
    });

    seekBar.addEventListener("input", () => {
      audio.currentTime = seekBar.value;
      updateDisplayTime();
    });

    function updateDisplayTime() {
      const currentMinutes = Math.floor(audio.currentTime / 60);
      const currentSeconds = Math.floor(audio.currentTime % 60);
      const durationMinutes = Math.floor(audio.duration / 60);
      const durationSeconds = Math.floor(audio.duration % 60);

      timeDisplay.textContent = `${currentMinutes}:${String(
        currentSeconds
      ).padStart(2, "0")} / ${durationMinutes}:${String(
        durationSeconds
      ).padStart(2, "0")}`;
    }

    // エフェクトのスライダー
    const reverbSlider = document.createElement("input");
    reverbSlider.type = "range";
    reverbSlider.min = 0;
    reverbSlider.max = 1;
    reverbSlider.step = 0.01;
    reverbSlider.value = 0;
    reverbSlider.classList.add("effect-slider");
    reverbSlider.addEventListener("input", () => {
      reverbNode.buffer = generateImpulseResponse(
        audioContext,
        reverbSlider.value,
        2
      );
    });

    const delaySlider = document.createElement("input");
    delaySlider.type = "range";
    delaySlider.min = 0;
    delaySlider.max = 1;
    delaySlider.step = 0.01;
    delaySlider.value = 0;
    delaySlider.classList.add("effect-slider");
    delaySlider.addEventListener("input", () => {
      delayNode.delayTime.value = delaySlider.value;
    });

    const echoSlider = document.createElement("input");
    echoSlider.type = "range";
    echoSlider.min = 0;
    echoSlider.max = 1;
    echoSlider.step = 0.01;
    echoSlider.value = 0;
    echoSlider.classList.add("effect-slider");
    echoSlider.addEventListener("input", () => {
      feedbackGainNode.gain.value = echoSlider.value;
    });

    // オンオフ状態に応じてエフェクトノードの接続を更新
    function updateConnections() {
      sourceNode.disconnect();
      let lastNode = sourceNode;

      if (reverbCheckbox.checked) {
        lastNode.connect(reverbNode);
        lastNode = reverbNode;
      }

      if (delayCheckbox.checked) {
        lastNode.connect(delayNode);
        lastNode = delayNode;
      }

      if (echoCheckbox.checked) {
        lastNode.connect(feedbackGainNode);
        lastNode = feedbackGainNode;
      }

      lastNode.connect(audioContext.destination);
    }

    // 各要素をコンテナに追加
    container.appendChild(displayNameInput);
    container.appendChild(toggleSwitchContainer);
    container.appendChild(volumeSlider);
    container.appendChild(seekBar);
    container.appendChild(timeDisplay);
    container.appendChild(reverbLabel);
    container.appendChild(reverbSlider);
    container.appendChild(delayLabel);
    container.appendChild(delaySlider);
    container.appendChild(echoLabel);
    container.appendChild(echoSlider);
    audioList.appendChild(container);
  });
});

// リバーブのインパルスレスポンスを生成する関数
function generateImpulseResponse(audioContext, duration, decay) {
  const rate = audioContext.sampleRate;
  const length = rate * duration;
  const impulse = audioContext.createBuffer(2, length, rate);
  for (let i = 0; i < 2; i++) {
    const channelData = impulse.getChannelData(i);
    for (let j = 0; j < length; j++) {
      channelData[j] =
        (Math.random() * 2 - 1) * Math.pow(1 - j / length, decay);
    }
  }
  return impulse;
}
