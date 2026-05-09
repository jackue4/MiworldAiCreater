const form = document.querySelector("#promptForm");
const input = document.querySelector("#promptInput");
const promptLog = document.querySelector("#promptLog");
const sendButton = form.querySelector(".send-button");
const gameVideo = document.querySelector(".game-video");

const defaultPrompt = "帮我在我的附近生成宏伟的中世界建筑城堡，需要有山脉，岩浆，地形要大，帅气";

const aiGenerationSteps = [
  "收到。我正在拆解你的需求：中世纪城堡、超大地形、山脉轮廓、岩浆地貌，以及更有压迫感的史诗级视觉中心。",
  "我会把城堡放在你附近的高地核心区，周围生成连绵山脉和断崖，让主体建筑显得更宏伟。",
  "岩浆会从山体裂隙和城堡外环沟壑中流出，形成天然护城河，同时强化危险、帅气、末日幻想的氛围。",
  "生成方案已确认：巨型中世纪主堡、尖塔群、山脉屏障、岩浆峡谷、大尺度地形起伏。现在开始在游戏世界中执行。"
];

let replyTimers = [];
let hasStartedVideo = false;

function autosizeInput() {
  input.style.height = "auto";
  input.style.height = `${Math.min(input.scrollHeight, 92)}px`;
  sendButton.disabled = input.value.trim().length === 0;
}

function createMessage(text, type, modifier = "") {
  const message = document.createElement("div");
  message.className = type === "user" ? "user-message" : `ai-message ai-message--assistant ${modifier}`.trim();

  const avatar = document.createElement("span");
  avatar.className = "avatar";
  avatar.textContent = type === "user" ? "你" : "AI";

  const content = document.createElement("p");
  content.textContent = text;

  message.append(avatar, content);
  return message;
}

function clearPendingReplies() {
  replyTimers.forEach((timer) => window.clearTimeout(timer));
  replyTimers = [];
}

function trimPromptLog() {
  while (promptLog.children.length > 6) {
    promptLog.firstElementChild.remove();
  }
}

function playVideoFromPrompt() {
  if (!gameVideo) return;

  gameVideo.controls = false;

  if (!hasStartedVideo) {
    gameVideo.currentTime = 0;
    hasStartedVideo = true;
  }

  gameVideo.play().catch(() => {
    gameVideo.controls = true;
  });
}

function pushAiGenerationFlow() {
  clearPendingReplies();

  aiGenerationSteps.forEach((reply, index) => {
    const timer = window.setTimeout(() => {
      promptLog.append(createMessage(reply, "ai", index === aiGenerationSteps.length - 1 ? "ai-message--final" : ""));
      trimPromptLog();
    }, 360 + index * 1250);

    replyTimers.push(timer);
  });
}

function pushPrompt(text) {
  promptLog.append(createMessage(text, "user"));
  trimPromptLog();
  playVideoFromPrompt();
  pushAiGenerationFlow();
}

input.addEventListener("input", autosizeInput);

input.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    form.requestSubmit();
  }
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const text = input.value.trim();
  if (!text) return;

  pushPrompt(text);
  input.value = "";
  autosizeInput();
});

input.value = defaultPrompt;
autosizeInput();
