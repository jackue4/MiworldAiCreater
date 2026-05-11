(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=document.querySelector(`#demoFrame`),t=document.querySelector(`#gameVideo`);document.querySelector(`#videoPlayButton`);var n=document.querySelector(`#videoMeta`),r=document.querySelector(`#chatList`),i=document.querySelector(`#agentForm`),a=document.querySelector(`#agentInput`),o=document.querySelector(`#sendButton`),s=document.querySelector(`#imageInput`),c=document.querySelector(`#selectedImage`),l=document.querySelector(`#selectedImagePreview`),u=document.querySelector(`#removeImageButton`),d=document.querySelectorAll(`.quick-prompts button`),f=document.querySelector(`.agent-sidebar`),p=document.querySelector(`#sidebarToggle`),m=`收到指令，正在执行代码，
-- 定义事件触发时的动作
function Script:Player_Click(event)
    -- 玩家点击方块时，判断点的是否是草块
    if event.blockid == 100 then
    	local success = Block:ReplaceBlock(452, event.x, event.y, event.z)
        -- Block:ReplaceBlock是官方提供的放置方块方法，可以在wiki中查看更多的方法
        -- local success 用来接收Block:ReplaceBlock运行后的结果，可以用来做是否成功放置的判断
        -- event.x是上面的官方事件产生的事件参数，可以通过Player_Click(event)中的event.x来获取事件中的x，event.blockid获取事件中的方块类型。event可以叫其他任意名字，例如Player_Click(aaa)，获取的时候就是aaa.x。
    end
end`,h=`正在分析玩家发的图片，已像素化拆解，正在编写代码，代码生成中...local Script = {}

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
end`,g=0,_=!1,v=null,y=null,b=!0;function x(){return new Intl.DateTimeFormat(`zh-CN`,{hour:`2-digit`,minute:`2-digit`}).format(new Date)}function S(){let r=t.videoWidth||1280,i=t.videoHeight||720;document.documentElement.style.setProperty(`--video-width`,r),document.documentElement.style.setProperty(`--video-height`,i),n.textContent=`${r} × ${i} · paused`,e.setAttribute(`data-video-size`,`${r}x${i}`)}function C(){a.style.height=`auto`,a.style.height=`${Math.min(a.scrollHeight,78)}px`,o.disabled=a.value.trim().length===0&&!y||_}function w(){return r.scrollHeight-r.scrollTop-r.clientHeight<32}function T(){r.scrollTo({top:r.scrollHeight,behavior:`auto`})}function E(){b&&T()}function D(e,t,n){let r=document.createElement(`article`);r.className=`chat-message chat-message--${t}`,n&&r.classList.add(`chat-message--${n}`);let i=document.createElement(`p`);i.textContent=e;let a=document.createElement(`time`);return a.textContent=t===`user`?`${x()} · You`:`${x()} · Agent`,r.append(i,a),r}function O(e,t){let n=document.createElement(`article`);n.className=`chat-message chat-message--user chat-message--image`;let r=document.createElement(`img`);r.src=t.src,r.alt=t.name?`用户上传的图片：${t.name}`:`用户上传的图片`;let i=document.createElement(`time`);if(i.textContent=`${x()} · You`,n.append(r),e){let t=document.createElement(`p`);t.textContent=e,n.append(t)}return n.append(i),n}function k(){f.classList.contains(`is-collapsed`)&&U(!1)}function A(e){k(),b=!0,r.append(D(e,`user`)),T()}function j(e,t){k(),b=!0,r.append(O(e,t)),T()}function M(e,t){r.append(D(e,`agent`,t)),E()}function N(e,t,n){let i=D(``,`agent`,`code`),a=i.querySelector(`p`),o=Math.ceil(e.length/2),s=0,c=!1;clearTimeout(v),_=!0,C(),b=!0,r.append(i),T();function l(){if(a.textContent=e.slice(0,s+1),s+=1,!c&&s>=o&&typeof n==`function`&&(c=!0,n()),E(),s<e.length){v=window.setTimeout(l,12);return}v=null,_=!1,C(),typeof t==`function`&&t()}l()}function P(){t.currentTime=0,t.play().then(W).catch(()=>{})}function F(){let e=()=>{t.currentTime<6||(t.removeEventListener(`timeupdate`,e),t.currentTime=6,t.pause(),W())};t.removeEventListener(`timeupdate`,e),t.addEventListener(`timeupdate`,e),P()}function I(){t.play().then(W).catch(()=>{})}function L(){N(m,()=>{M(`已执行代码`),F()})}function R(){N(h,null,I)}function z(){if(g===0){g=1,L();return}if(g===1){g=2,R();return}I()}function B(e,t){t?j(e,t):A(e),e&&z()}function V(e){y=e,l.src=e.src,l.alt=e.name?`已选择的图片预览：${e.name}`:`已选择的图片预览`,c.hidden=!1,C()}function H(){y=null,l.removeAttribute(`src`),l.alt=`已选择的图片预览`,c.hidden=!0,s.value=``,C()}function U(e){f.classList.toggle(`is-collapsed`,e),p.setAttribute(`aria-expanded`,String(!e)),p.setAttribute(`aria-label`,e?`展开 Agent 侧边栏`:`收起 Agent 侧边栏`)}function W(){let e=!t.paused&&!t.ended;n.textContent=`${t.videoWidth||1280} × ${t.videoHeight||720} · ${e?`playing`:`paused`}`}t.addEventListener(`loadedmetadata`,()=>{t.pause(),t.currentTime=0,S(),W()}),t.addEventListener(`play`,W),t.addEventListener(`pause`,W),t.addEventListener(`ended`,W),a.addEventListener(`input`,C),r.addEventListener(`scroll`,()=>{b=w()}),s.addEventListener(`change`,()=>{let e=s.files?.[0];if(!e){H();return}let t=new FileReader;t.addEventListener(`load`,()=>{typeof t.result==`string`&&V({name:e.name,src:t.result})}),t.readAsDataURL(e)}),u.addEventListener(`click`,H),a.addEventListener(`keydown`,e=>{e.key===`Enter`&&!e.shiftKey&&(e.preventDefault(),i.requestSubmit())}),i.addEventListener(`submit`,e=>{e.preventDefault();let t=a.value.trim(),n=y;!t&&!n||_||(B(t,n),a.value=``,H(),C())}),d.forEach(e=>{e.addEventListener(`click`,()=>{_||B(e.dataset.prompt)})}),p.addEventListener(`click`,()=>{U(!f.classList.contains(`is-collapsed`))}),window.demoAgent={video:t,setVideoSource(e){t.pause(),t.src=e,t.load()}},C(),T();