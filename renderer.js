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

    // エフェクトのオンオフ状態を管理するチェックボックス
    const reverbCheckbox = document.createElement("input");
    reverbCheckbox.type = "checkbox";
    reverbCheckbox.addEventListener("change", updateConnections);

    // ラベルを追加
    const reverbLabel = document.createElement("label");
    reverbLabel.textContent = "Reverb";
    reverbLabel.appendChild(reverbCheckbox);

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
    // 音量スライダーコンテナを作成
    const volumeSliderContainer = document.createElement("div");
    volumeSliderContainer.classList.add("volume-slider-container");

    // 音量アイコンを作成
    const volumeIcon = document.createElement("div");
    volumeIcon.classList.add("volume-icon");
    volumeIcon.textContent = "🔊"; // 適当な音量アイコン、またはアイコンフォントなど

    // 音量スライダーを作成
    const volumeSlider = document.createElement("input");
    volumeSlider.type = "range";
    volumeSlider.min = 0;
    volumeSlider.max = 1;
    volumeSlider.step = 0.01;
    volumeSlider.value = 0.25; // 初期値を0.5に設定（最大音量の半分）
    volumeSlider.classList.add("volume-slider");
    volumeSlider.textContent = "音量";
    volumeSlider.addEventListener("input", () => {
      audio.volume = volumeSlider.value;
    });

    volumeSlider.addEventListener("wheel", (event) => {
      event.preventDefault(); // デフォルトのスクロール動作を防止
      const delta = Math.sign(event.deltaY) * 0.01; // ホイールの上下を判定し音量ステップを設定
      volumeSlider.value = Math.min(
        Math.max(parseFloat(volumeSlider.value) - delta, 0),
        1
      ); // 0～1の範囲に制限
      audio.volume = volumeSlider.value; // 音量を反映
    });

    // コンテナにアイコンとスライダーを追加
    volumeSliderContainer.appendChild(volumeIcon);
    volumeSliderContainer.appendChild(volumeSlider);

    // 既存のcontainerに音量スライダーコンテナを追加
    container.appendChild(volumeSliderContainer);
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

    // オンオフ状態に応じてエフェクトノードの接続を更新
    function updateConnections() {
      sourceNode.disconnect();
      let lastNode = sourceNode;

      if (reverbCheckbox.checked) {
        lastNode.connect(reverbNode);
        lastNode = reverbNode;
      }
      lastNode.connect(audioContext.destination);
    }

    // ループ再生を管理するチェックボックス
    const loopCheckbox = document.createElement("input");
    loopCheckbox.type = "checkbox";
    loopCheckbox.id = `loop-${index}`;
    loopCheckbox.addEventListener("change", () => {
      audio.loop = loopCheckbox.checked; // チェックされた場合はループ再生を有効にする
    });

    // ループラベルを追加
    const loopLabel = document.createElement("label");
    loopLabel.setAttribute("for", `loop-${index}`);
    loopLabel.textContent = "ループ再生";
    loopLabel.style.marginLeft = "10px"; // 見やすさのための余白調整
    loopLabel.appendChild(loopCheckbox);

    // ループ設定を表示するためにコンテナに追加
    container.appendChild(loopLabel);

    // 各要素をコンテナに追加
    container.appendChild(displayNameInput);
    container.appendChild(toggleSwitchContainer);
    container.appendChild(volumeSlider);
    container.appendChild(seekBar);
    container.appendChild(timeDisplay);
    container.appendChild(reverbLabel);
    container.appendChild(reverbSlider);
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
