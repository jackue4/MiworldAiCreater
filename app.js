const demoFrame = document.querySelector("#demoFrame");
const gameVideo = document.querySelector("#gameVideo");
const videoPlayButton = document.querySelector("#videoPlayButton");
const videoMeta = document.querySelector("#videoMeta");
const chatList = document.querySelector("#chatList");
const agentForm = document.querySelector("#agentForm");
const agentInput = document.querySelector("#agentInput");
const sendButton = document.querySelector("#sendButton");
const imageInput = document.querySelector("#imageInput");
const selectedImage = document.querySelector("#selectedImage");
const selectedImagePreview = document.querySelector("#selectedImagePreview");
const removeImageButton = document.querySelector("#removeImageButton");
const quickPrompts = document.querySelectorAll(".quick-prompts button");
const agentSidebar = document.querySelector(".agent-sidebar");
const sidebarToggle = document.querySelector("#sidebarToggle");

const scriptedCodeReply = `收到指令，正在执行代码，
-- 定义事件触发时的动作
function Script:Player_Click(event)
    -- 玩家点击方块时，判断点的是否是草块
    if event.blockid == 100 then
    	local success = Block:ReplaceBlock(452, event.x, event.y, event.z)
        -- Block:ReplaceBlock是官方提供的放置方块方法，可以在wiki中查看更多的方法
        -- local success 用来接收Block:ReplaceBlock运行后的结果，可以用来做是否成功放置的判断
        -- event.x是上面的官方事件产生的事件参数，可以通过Player_Click(event)中的event.x来获取事件中的x，event.blockid获取事件中的方块类型。event可以叫其他任意名字，例如Player_Click(aaa)，获取的时候就是aaa.x。
    end
end`;

const secondScriptedReply = `正在分析玩家发的图片，已像素化拆解，正在编写代码，代码生成中...local Script = {}

local BLOCK = {
    grass = 100,        -- 长草土块
    white = 99,         -- 混凝土，可作为白色墙体；如果你有更白的方块，可以替换这里
    dark = 648,         -- 黑色玻璃，可作为深色侧墙；也可换成黑色/深灰建筑方块
    glass = 632,        -- 透明玻璃块
    woodDoor = 812,     -- 轻木门
    leaf = 219,         -- 落叶松树叶，用作绿篱
    path = 8            -- 雕纹砖块，用作门前小路
}

local BUILD_INTERVAL = 0.03
local building = false

function Script:OnStart()
    self:AddTriggerEvent(TriggerEvent.PlayerClickBlock, self.OnPlayerClickBlock)
end

function Script:OnPlayerClickBlock(event)
    if building then
        return
    end

    building = true

    local baseX = math.floor(event.x)
    local baseY = math.floor(event.y) + 1
    local baseZ = math.floor(event.z)

    self:BuildModernHouse(baseX, baseY, baseZ, event.worldid or event.mapid)
end

function Script:AddBlockQueue(queue, dx, dy, dz, blockid, face)
    table.insert(queue, {
        dx = dx,
        dy = dy,
        dz = dz,
        blockid = blockid,
        face = face or 0
    })
end`;

let promptStep = 0;
let isTypingReply = false;
let typewriterTimer = null;
let selectedImageData = null;
let shouldStickToChatBottom = true;

function formatTime() {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date());
}

function setVideoSizeFromMetadata() {
  const width = gameVideo.videoWidth || 1280;
  const height = gameVideo.videoHeight || 720;

  document.documentElement.style.setProperty("--video-width", width);
  document.documentElement.style.setProperty("--video-height", height);
  videoMeta.textContent = `${width} × ${height} · paused`;
  demoFrame.setAttribute("data-video-size", `${width}x${height}`);
}

function autosizeInput() {
  agentInput.style.height = "auto";
  agentInput.style.height = `${Math.min(agentInput.scrollHeight, 78)}px`;
  sendButton.disabled = (agentInput.value.trim().length === 0 && !selectedImageData) || isTypingReply;
}

function isChatNearBottom() {
  return chatList.scrollHeight - chatList.scrollTop - chatList.clientHeight < 32;
}

function scrollChatToBottom() {
  chatList.scrollTo({
    top: chatList.scrollHeight,
    behavior: "auto"
  });
}

function scrollChatToBottomIfNeeded() {
  if (shouldStickToChatBottom) {
    scrollChatToBottom();
  }
}

function createMessage(text, type, modifier) {
  const message = document.createElement("article");
  message.className = `chat-message chat-message--${type}`;
  if (modifier) {
    message.classList.add(`chat-message--${modifier}`);
  }

  const content = document.createElement("p");
  content.textContent = text;

  const time = document.createElement("time");
  time.textContent = type === "user" ? `${formatTime()} · You` : `${formatTime()} · Agent`;

  message.append(content, time);
  return message;
}

function createImageMessage(text, imageData) {
  const message = document.createElement("article");
  message.className = "chat-message chat-message--user chat-message--image";

  const image = document.createElement("img");
  image.src = imageData.src;
  image.alt = imageData.name ? `用户上传的图片：${imageData.name}` : "用户上传的图片";

  const time = document.createElement("time");
  time.textContent = `${formatTime()} · You`;

  message.append(image);

  if (text) {
    const content = document.createElement("p");
    content.textContent = text;
    message.append(content);
  }

  message.append(time);
  return message;
}

function ensureSidebarExpanded() {
  if (agentSidebar.classList.contains("is-collapsed")) {
    setSidebarCollapsed(false);
  }
}

function appendUserMessage(text) {
  ensureSidebarExpanded();
  shouldStickToChatBottom = true;
  chatList.append(createMessage(text, "user"));
  scrollChatToBottom();
}

function appendUserImageMessage(text, imageData) {
  ensureSidebarExpanded();
  shouldStickToChatBottom = true;
  chatList.append(createImageMessage(text, imageData));
  scrollChatToBottom();
}

function appendAgentMessage(text, modifier) {
  chatList.append(createMessage(text, "agent", modifier));
  scrollChatToBottomIfNeeded();
}

function typeAgentMessage(text, onComplete, onProgress) {
  const message = createMessage("", "agent", "code");
  const content = message.querySelector("p");
  const progressTriggerIndex = Math.ceil(text.length / 2);
  let charIndex = 0;
  let hasTriggeredProgress = false;

  clearTimeout(typewriterTimer);
  isTypingReply = true;
  autosizeInput();
  shouldStickToChatBottom = true;
  chatList.append(message);
  scrollChatToBottom();

  function typeNextCharacter() {
    content.textContent = text.slice(0, charIndex + 1);
    charIndex += 1;

    if (!hasTriggeredProgress && charIndex >= progressTriggerIndex && typeof onProgress === "function") {
      hasTriggeredProgress = true;
      onProgress();
    }

    scrollChatToBottomIfNeeded();

    if (charIndex < text.length) {
      typewriterTimer = window.setTimeout(typeNextCharacter, 12);
      return;
    }

    typewriterTimer = null;
    isTypingReply = false;
    autosizeInput();
    if (typeof onComplete === "function") {
      onComplete();
    }
  }

  typeNextCharacter();
}

function playVideoFromStart() {
  gameVideo.currentTime = 0;
  gameVideo.play().then(syncPlayState).catch(() => {});
}

function playVideoToExecutionPoint() {
  const pauseAtSecond = 6;

  const pauseAtExecutionPoint = () => {
    if (gameVideo.currentTime < pauseAtSecond) return;

    gameVideo.removeEventListener("timeupdate", pauseAtExecutionPoint);
    gameVideo.currentTime = pauseAtSecond;
    gameVideo.pause();
    syncPlayState();
  };

  gameVideo.removeEventListener("timeupdate", pauseAtExecutionPoint);
  gameVideo.addEventListener("timeupdate", pauseAtExecutionPoint);
  playVideoFromStart();
}

function continueVideoPlayback() {
  gameVideo.play().then(syncPlayState).catch(() => {});
}

function runFirstPromptFlow() {
  typeAgentMessage(scriptedCodeReply, () => {
    appendAgentMessage("已执行代码");
    playVideoToExecutionPoint();
  });
}

function runSecondPromptFlow() {
  typeAgentMessage(secondScriptedReply, null, continueVideoPlayback);
}

function runTextPromptFlow() {
  if (promptStep === 0) {
    promptStep = 1;
    runFirstPromptFlow();
    return;
  }

  if (promptStep === 1) {
    promptStep = 2;
    runSecondPromptFlow();
    return;
  }

  continueVideoPlayback();
}

function addAgentExchange(text, imageData) {
  if (imageData) {
    appendUserImageMessage(text, imageData);
  } else {
    appendUserMessage(text);
  }

  if (text) {
    runTextPromptFlow();
  }
}

function setSelectedImage(imageData) {
  selectedImageData = imageData;
  selectedImagePreview.src = imageData.src;
  selectedImagePreview.alt = imageData.name ? `已选择的图片预览：${imageData.name}` : "已选择的图片预览";
  selectedImage.hidden = false;
  autosizeInput();
}

function clearSelectedImage() {
  selectedImageData = null;
  selectedImagePreview.removeAttribute("src");
  selectedImagePreview.alt = "已选择的图片预览";
  selectedImage.hidden = true;
  imageInput.value = "";
  autosizeInput();
}

function setSidebarCollapsed(isCollapsed) {
  agentSidebar.classList.toggle("is-collapsed", isCollapsed);
  sidebarToggle.setAttribute("aria-expanded", String(!isCollapsed));
  sidebarToggle.setAttribute("aria-label", isCollapsed ? "展开 Agent 侧边栏" : "收起 Agent 侧边栏");
}

function syncPlayState() {
  const isPlaying = !gameVideo.paused && !gameVideo.ended;
  videoMeta.textContent = `${gameVideo.videoWidth || 1280} × ${gameVideo.videoHeight || 720} · ${isPlaying ? "playing" : "paused"}`;
}

gameVideo.addEventListener("loadedmetadata", () => {
  gameVideo.pause();
  gameVideo.currentTime = 0;
  setVideoSizeFromMetadata();
  syncPlayState();
});

gameVideo.addEventListener("play", syncPlayState);
gameVideo.addEventListener("pause", syncPlayState);
gameVideo.addEventListener("ended", syncPlayState);

agentInput.addEventListener("input", autosizeInput);

chatList.addEventListener("scroll", () => {
  shouldStickToChatBottom = isChatNearBottom();
});

imageInput.addEventListener("change", () => {
  const file = imageInput.files?.[0];
  if (!file) {
    clearSelectedImage();
    return;
  }

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    if (typeof reader.result === "string") {
      setSelectedImage({
        name: file.name,
        src: reader.result
      });
    }
  });
  reader.readAsDataURL(file);
});

removeImageButton.addEventListener("click", clearSelectedImage);

agentInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    agentForm.requestSubmit();
  }
});

agentForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const text = agentInput.value.trim();
  const imageData = selectedImageData;
  if ((!text && !imageData) || isTypingReply) return;

  addAgentExchange(text, imageData);
  agentInput.value = "";
  clearSelectedImage();
  autosizeInput();
});

quickPrompts.forEach((button) => {
  button.addEventListener("click", () => {
    if (isTypingReply) return;
    addAgentExchange(button.dataset.prompt);
  });
});

sidebarToggle.addEventListener("click", () => {
  setSidebarCollapsed(!agentSidebar.classList.contains("is-collapsed"));
});

window.demoAgent = {
  video: gameVideo,
  setVideoSource(src) {
    gameVideo.pause();
    gameVideo.src = src;
    gameVideo.load();
  }
};

autosizeInput();
scrollChatToBottom();
