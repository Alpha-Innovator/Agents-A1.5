(() => {
  "use strict";
  const DATA = JSON.parse(
      document.querySelector("#deploymentData").textContent,
    ),
    E = DATA.evidence,
    C = DATA.config;
  const $ = (s) => document.querySelector(s),
    $$ = (s) => [...document.querySelectorAll(s)];
  const tStart = 3,
    tAnswer = 26,
    duration = 30,
    stepLength = (tAnswer - tStart) / E.steps.length;
  const state = {
    lang: "en",
    hardware: "nvidia",
    setup: "runtime",
    runtime: "sglang",
    original: false,
    t: 0,
    playing: false,
    privacy: "offline",
    evidenceIndex: 0,
  };
  const hardware = {
    mac: {
      name: "Mac / Apple Silicon",
      note: "hardwareMac",
      runtime: "llama",
    },
    nvidia: {
      name: "NVIDIA GPU",
      note: "hardwareNvidia",
      runtime: "sglang",
    },
    huawei: {
      name: "Huawei Ascend NPU",
      note: "hardwareHuawei",
      runtime: "ascend",
    },
    amd: {
      name: "AMD GPU",
      note: "hardwareAmd",
      runtime: "rocm",
    },
  };
  const runtimeNames = {
    llama: "llama.cpp",
    vllm: "vLLM",
    sglang: "SGLang",
    ascend: "vLLM Ascend",
    rocm: "vLLM / ROCm",
  };
  const sources = {
    ascend:
      "https://docs.vllm.ai/projects/ascend/en/main/getting_started/installation.html",
    rocm: "https://docs.vllm.ai/en/latest/getting_started/installation/gpu/",
  };
  let frameId = 0,
    lastTime = 0,
    lastFrame = -99,
    toastTimer;
  const tr = (key) => DATA.copy[state.lang][key];
  const escape = (text) =>
    String(text).replace(
      /[&<>"']/g,
      (ch) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[ch],
    );
  const time = (n) => "00:" + String(Math.floor(n)).padStart(2, "0");
  const route = (step) =>
    step.tool === "google_search"
      ? "search"
      : step.tool === "read_page"
        ? "read"
        : "code";
  function evidencePeek(step) {
    if (step.tool === "google_search") {
      const matches = [
        ...step.response.matchAll(
          /\d+\.\s+\*\*\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
        ),
      ].slice(0, 2);
      return (
        '<div class="source-preview">' +
        matches
          .map(
            (m) =>
              "<div><span>↗</span><div><strong>" +
              escape(m[1]) +
              "</strong><small>" +
              escape(new URL(m[2]).hostname) +
              "</small></div></div>",
          )
          .join("") +
        "</div>"
      );
    }
    const lines = step.response
      .split("\n")
      .filter((l) => /^\d+\.\s/.test(l))
      .slice(0, step.tool === "PythonInterpreter" ? 6 : 3);
    return (
      '<div class="method-preview">' +
      lines
        .map(
          (line) =>
            "<span>" + escape(line.replace(/`/g, "").slice(0, 100)) + "</span>",
        )
        .join("") +
      "</div>"
    );
  }
  function toast(message) {
    $("#toast").textContent = message;
    $("#toast").classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(
      () => $("#toast").classList.remove("visible"),
      2300,
    );
  }
  async function copyCode(button) {
    const text = button
      .closest(".code-window")
      .querySelector("pre").textContent;
    try {
      if (navigator.clipboard && window.isSecureContext)
        await navigator.clipboard.writeText(text);
      else {
        const area = document.createElement("textarea");
        area.value = text;
        area.style.cssText = "position:fixed;left:-10000px;top:0";
        document.body.append(area);
        area.select();
        const ok = document.execCommand("copy");
        area.remove();
        if (!ok) throw Error("Clipboard unavailable");
        button.focus();
      }
      toast(tr("copied"));
    } catch {
      toast(tr("copyFailed"));
    }
  }
  function codeWindow(label, text) {
    return (
      '<div class="code-window"><div class="code-caption"><span>' +
      escape(label) +
      "</span><button data-copy>" +
      escape(tr("copy")) +
      "</button></div><pre>" +
      escape(text) +
      "</pre></div>"
    );
  }
  function renderSetup() {
    const isAdapted = ["ascend", "rocm"].includes(state.runtime),
      current = hardware[state.hardware];
    let html = "";
    if (state.setup === "runtime") {
      const choices = ["sglang", "vllm", "llama"];
      html =
        '<p class="eyebrow">' +
        escape(current.name) +
        "</p><h3>" +
        escape(tr(isAdapted ? "adaptationTitle" : "runtimeTitle")) +
        "</h3><p>" +
        escape(tr(isAdapted ? "adaptationNote" : "runtimeDesc")) +
        "</p>";
      html +=
        '<div class="runtime-select">' +
        choices
          .map(
            (key) =>
              '<button data-runtime="' +
              key +
              '" aria-pressed="' +
              (key === state.runtime) +
              '">' +
              runtimeNames[key] +
              "</button>",
          )
          .join("") +
        "</div>";
      if (["ascend", "rocm"].includes(current.runtime))
        html += '<div class="runtime-adaptation"><span>' +
          escape(tr("deviceTemplate")) + '</span><button data-runtime="' +
          current.runtime + '" aria-pressed="' + isAdapted + '">' +
          runtimeNames[current.runtime] + '</button></div>';
      if (!isAdapted)
        html +=
          '<div class="code-mode"><button data-original="false" aria-pressed="' +
          !state.original +
          '">' +
          escape(tr("localExample")) +
          '</button><button data-original="true" aria-pressed="' +
          state.original +
          '">' +
          escape(tr("originalScript")) +
          "</button></div>";
      const code =
        state.original && !isAdapted
          ? C.originals[state.runtime]
          : C.local[state.runtime];
      html += codeWindow(
        runtimeNames[state.runtime] +
          " / " +
          (state.original && !isAdapted ? "original.sh" : "local-example.sh"),
        code,
      );
      html +=
        '<p class="small-note">' +
        escape(
          tr(state.original && !isAdapted ? "scriptSource" : "templateSource"),
        ) +
        "</p>";
      if (isAdapted)
        html +=
          '<a class="framework-link" href="' +
          sources[state.runtime] +
          '" target="_blank" rel="noopener">' +
          escape(tr("frameworkDocs")) +
          "</a>";
      else
        html += '<p class="small-note">' + escape(tr("runtimeNote")) + "</p>";
      html +=
        '<div class="endpoint"><span>' +
        escape(tr("endpointLabel")) +
        "</span><code>http://127.0.0.1:8080/v1</code><p>" +
        escape(tr("endpointNote")) +
        "</p></div>";
    } else if (state.setup === "tools") {
      html =
        '<p class="eyebrow">FUNCTION CALLING</p><h3>' +
        escape(tr("toolsTitle")) +
        "</h3><p>" +
        escape(tr("toolsDesc")) +
        '</p><div class="tool-list">';
      for (const [name, symbol, key] of [
        ["search", "⌕", "searchDesc"],
        ["read_page", "≡", "readDesc"],
        ["code_tools", "&lt;/&gt;", "codeDesc"],
      ])
        html +=
          '<div class="tool-config-item"><span>' +
          symbol +
          "</span><div><strong>" +
          name +
          "</strong><p>" +
          escape(tr(key)) +
          "</p></div></div>";
      html +=
        '</div><p class="small-note">' +
        escape(tr("toolNames")) +
        "</p><details><summary>" +
        escape(tr("toolConfig")) +
        "</summary>" +
        codeWindow(
          "tool request / schema example",
          JSON.stringify(C.tools, null, 2),
        ) +
        '</details><p class="small-note">' +
        escape(tr("toolsNote")) +
        "</p>";
    } else {
      html =
        '<p class="eyebrow">BRING YOUR HARNESS</p><h3>' +
        escape(tr("codingTitle")) +
        "</h3><p>" +
        escape(tr("codingDesc")) +
        '</p><div class="coding-flow">' +
        escape(tr("codingRoute")) +
        "</div>" +
        codeWindow("Claude Code / local endpoint", C.harness) +
        '<p class="small-note">' +
        escape(tr("codingNote")) +
        '</p><p class="small-note">' +
        escape(tr("codingPrivacy")) +
        "</p>";
    }
    $("#setupContent").innerHTML = html;
    $("#setupContent").scrollTop = 0;
    $("#setupContent").setAttribute("aria-labelledby", "tab-" + state.setup);
    $$("[data-setup]").forEach((b) => {
      const active = b.dataset.setup === state.setup;
      b.setAttribute("aria-selected", String(active));
      b.tabIndex = active ? 0 : -1;
    });
  }
  function setHardware(key) {
    if (!hardware[key]) return;
    state.hardware = key;
    state.runtime = hardware[key].runtime;
    state.original = false;
    $("#machine").dataset.hardware = key;
    $("#hardwareNote").textContent = tr(hardware[key].note);
    $$("#hardwareChoices button").forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.hardware === key)),
    );
    renderSetup();
  }
  function setSetup(key) {
    if (!["runtime", "tools", "code"].includes(key)) return;
    state.setup = key;
    renderSetup();
  }
  function renderPrivacy() {
    $("#privacyPanel").dataset.mode = state.privacy;
    const online = state.privacy === "online";
    $("#privacyModeTitle").textContent = tr(
      online ? "onlineTitle" : "offlineTitle",
    );
    $("#privacyModeText").textContent = tr(
      online ? "onlineText" : "offlineText",
    );
    $("#networkStatus").textContent = tr(online ? "networkOn" : "networkOff");
    $$("[data-privacy]").forEach((b) =>
      b.setAttribute(
        "aria-pressed",
        String(b.dataset.privacy === state.privacy),
      ),
    );
  }
  function currentIndex() {
    return state.t < tStart
      ? -1
      : state.t >= tAnswer
        ? E.steps.length
        : Math.min(
            E.steps.length - 1,
            Math.floor((state.t - tStart) / stepLength),
          );
  }
  function frame(force = false) {
    const index = currentIndex();
    $("#scrubber").value = state.t;
    $("#timecode").textContent = time(state.t) + " / 00:30";
    $("#playPause").textContent = state.playing ? "Ⅱ" : "▶";
    $("#playPause").setAttribute(
      "aria-label",
      tr(state.playing ? "pause" : "play"),
    );
    $("#taskPanel").classList.toggle("is-playing", state.playing);
    if (index === lastFrame && !force) return;
    lastFrame = index;
    const box = $("#taskReadout");
    box.classList.toggle("answer", index === E.steps.length);
    let html = "";
    if (index < 0) {
      html =
        '<span class="eyebrow">' +
        escape(tr("readyLabel")) +
        "</span><h4>" +
        escape(tr("readyTitle")) +
        "</h4><p>" +
        escape(tr("readyBody")) +
        '</p><button class="mini-start" data-play-task>' +
        escape(tr("start")) +
        " <span>↗</span></button>";
    } else if (index === E.steps.length) {
      html =
        '<span class="eyebrow">' +
        escape(tr("answerLabel")) +
        '</span><div class="answer-row"><strong>' +
        parseInt(E.reference, 10) +
        "</strong><span>" +
        escape(tr("answerUnit")) +
        "</span></div><p>" +
        escape(tr("answerBody")) +
        '</p><p class="answer-foot">' +
        escape(tr("answerFoot")) +
        '</p><div class="answer-tools">' +
        ["google_search", "read_page", "PythonInterpreter"]
          .map(
            (name) =>
              "<span><b>" +
              E.steps.filter((s) => s.tool === name).length +
              "</b> " +
              name +
              "</span>",
          )
          .join("") +
        "</div>";
    } else {
      const step = E.steps[index];
      html =
        '<span class="eyebrow">' +
        escape(tr("stepOf")) +
        " " +
        String(index + 1).padStart(2, "0") +
        ' / 09</span><span class="step-tool">' +
        escape(step.tool) +
        "</span><h4>" +
        escape(tr("stepTitles")[index]) +
        "</h4>";
      let detail = step.arguments.query || step.arguments.url || step.response;
      if (step.tool === "PythonInterpreter")
        detail = step.response.split("\n").slice(0, 3).join("\n");
      html +=
        "<code>" +
        escape(detail.length > 190 ? detail.slice(0, 187) + "…" : detail) +
        "</code>" +
        evidencePeek(step);
    }
    box.innerHTML = '<div class="readout-enter">' + html + "</div>";
    box.scrollTop = 0;
    const active =
      index < 0
        ? "idle"
        : index === E.steps.length
          ? "answer"
          : route(E.steps[index]);
    $("#flowStage").dataset.active = active;
    $$("[data-tool-node]").forEach((el) =>
      el.classList.toggle("active", el.dataset.toolNode === active),
    );
    $$("[data-step]").forEach((b) => {
      const selected = Number(b.dataset.step) === index;
      b.classList.toggle("done", Number(b.dataset.step) < index);
      if (selected) b.setAttribute("aria-current", "step");
      else b.removeAttribute("aria-current");
    });
  }
  function tick(now) {
    if (!state.playing) return;
    const elapsed = Math.min(0.15, (now - lastTime) / 1000);
    lastTime = now;
    state.t = Math.min(duration, state.t + elapsed);
    if (state.t >= duration) {
      state.playing = false;
      frame();
      return;
    }
    frame();
    frameId = requestAnimationFrame(tick);
  }
  function setPlaying(value) {
    if (value) $("#demoVideo").pause();
    cancelAnimationFrame(frameId);
    // Both play controls start with a visible tool call, rather than spending
    // three seconds on the same ready card. Resume keeps the current position.
    if (value && (state.t < tStart || state.t >= duration)) state.t = tStart;
    state.playing = !!value;
    lastTime = performance.now();
    frame();
    if (state.playing) frameId = requestAnimationFrame(tick);
  }
  function seek(value) {
    state.t = Math.max(0, Math.min(duration, Number(value) || 0));
    frame();
  }
  function renderTrack() {
    $("#traceTrack").innerHTML =
      E.steps
        .map(
          (step, i) =>
            '<button data-step="' +
            i +
            '" aria-label="' +
            escape(tr("stepTitles")[i]) +
            '" title="' +
            escape(tr("stepTitles")[i]) +
            '">' +
            String(i + 1).padStart(2, "0") +
            "</button>",
        )
        .join("") +
      '<button class="result-step" data-step="9" aria-label="' +
      escape(tr("finalAnswer")) +
      '" title="' +
      escape(tr("finalAnswer")) +
      '">✓</button>';
  }
  function renderEvidence() {
    $("#evidenceList").innerHTML =
      E.steps
        .map(
          (step, i) =>
            '<li><button data-evidence-index="' +
            i +
            '" aria-current="' +
            (i === state.evidenceIndex) +
            '"><b>' +
            String(i + 1).padStart(2, "0") +
            "</b>" +
            escape(step.tool) +
            "</button></li>",
        )
        .join("") +
      '<li><button data-evidence-index="9" aria-current="' +
      (state.evidenceIndex === 9) +
      '"><b>✓</b>' +
      escape(tr("finalAnswer")) +
      "</button></li>";
    const entry =
      state.evidenceIndex === 9 ? null : E.steps[state.evidenceIndex];
    let html =
      '<div class="record-location">' +
      escape(E.source) +
      (entry ? " · messages[" + entry.messageIndex + "]" : "") +
      "</div>";
    html +=
      "<h4>" +
      escape("Question (English translation)") +
      "</h4><pre>" +
      escape("In the official Java SE 17 API documentation, how many static methods does java.util.Objects declare?") +
      "</pre>";
    if (entry)
      html +=
        "<h4>" +
        escape(tr("request")) +
        " / " +
        escape(entry.tool) +
        "</h4><pre>" +
        escape(JSON.stringify(entry.arguments, null, 2)) +
        "</pre><h4>" +
        escape(tr("response")) +
        "</h4><pre>" +
        escape(entry.response) +
        "</pre>";
    else
      html +=
        "<h4>" +
        escape(tr("finalAnswer")) +
        "</h4><pre>" +
        escape(E.answer) +
        "</pre>";
    $("#evidenceDetail").innerHTML = html;
  }
  function applyLanguage(lang) {
    lang = "en";
    state.lang = lang;
    document.documentElement.lang = lang === "en" ? "en" : "zh-CN";
    document.title =
      lang === "en"
        ? "Agents-A1.5 · Local Deployment"
        : "Agents-A1.5 · 本地化部署";
    $$("[data-i18n]").forEach((el) => (el.textContent = tr(el.dataset.i18n)));
    $$("[data-html]").forEach((el) => (el.innerHTML = tr(el.dataset.html)));
    $$("[data-title]").forEach((el) => {
      el.title = tr(el.dataset.title);
      el.setAttribute("aria-label", tr(el.dataset.title));
    });
    $$("[data-language]").forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.language === lang)),
    );
    $("#closeEvidence").setAttribute("aria-label", tr("close"));
    $("#hardwareNote").textContent = tr(hardware[state.hardware].note);
    renderSetup();
    renderPrivacy();
    renderTrack();
    frame(true);
    if ($("#evidenceDialog").open) renderEvidence();
  }
  $$("[data-language]").forEach((b) =>
    b.addEventListener("click", () => applyLanguage(b.dataset.language)),
  );
  $$("#hardwareChoices button").forEach((b) =>
    b.addEventListener("click", () => setHardware(b.dataset.hardware)),
  );
  $$("[data-setup]").forEach((b) =>
    b.addEventListener("click", () => setSetup(b.dataset.setup)),
  );
  $(".setup-tabs").addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const keys = ["runtime", "tools", "code"];
    let i = keys.indexOf(state.setup);
    i =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? 2
          : (i + (event.key === "ArrowRight" ? 1 : 2)) % 3;
    setSetup(keys[i]);
    $("#tab-" + keys[i]).focus();
  });
  $("#setupContent").addEventListener("click", (event) => {
    const b = event.target.closest("button");
    if (!b) return;
    if (b.hasAttribute("data-copy")) copyCode(b);
    if (b.dataset.runtime) {
      // Keep all supplied scripts accessible and show their matching device route.
      if (["sglang", "vllm"].includes(b.dataset.runtime) && state.hardware !== "nvidia")
        setHardware("nvidia");
      if (b.dataset.runtime === "llama" && !["mac", "nvidia"].includes(state.hardware))
        setHardware("mac");
      state.runtime = b.dataset.runtime;
      state.original = false;
      renderSetup();
    }
    if (b.hasAttribute("data-original")) {
      state.original = b.dataset.original === "true";
      renderSetup();
    }
  });
  $$("[data-privacy]").forEach((b) =>
    b.addEventListener("click", () => {
      state.privacy = b.dataset.privacy;
      renderPrivacy();
    }),
  );
  $("#playPause").addEventListener("click", () => setPlaying(!state.playing));
  $("#restart").addEventListener("click", () => {
    seek(0);
    setPlaying(true);
  });
  $("#scrubber").addEventListener("input", (event) => {
    // Pausing renders the old time back into the range; keep the user's value.
    const selectedTime = Number(event.target.value);
    setPlaying(false);
    seek(selectedTime);
  });
  $("#taskReadout").addEventListener("click", (event) => {
    if (event.target.closest("[data-play-task]")) setPlaying(true);
  });
  $("#traceTrack").addEventListener("click", (event) => {
    const b = event.target.closest("[data-step]");
    if (!b) return;
    setPlaying(false);
    seek(
      +b.dataset.step === 9
        ? tAnswer
        : tStart + +b.dataset.step * stepLength + 0.01,
    );
  });
  $$("[data-start-demo]").forEach((b) =>
    b.addEventListener("click", () => {
      seek(0);
      setPlaying(true);
    }),
  );
  const demoVideo = $("#demoVideo");
  let offlineVideoURL;
  function demoVideoSource() {
    const source = demoVideo.dataset.src;
    if (!source.startsWith("data:video/mp4;base64,")) return source;
    if (!offlineVideoURL) {
      // Decode in bounded chunks. A large data URL in video.src makes Chromium
      // retain multiple copies of the full recording while seeking/inspecting.
      const chunks = [], start = source.indexOf(",") + 1;
      for (let offset = start; offset < source.length; offset += 512 * 1024) {
        const binary = atob(source.slice(offset, offset + 512 * 1024));
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        chunks.push(bytes);
      }
      offlineVideoURL = URL.createObjectURL(new Blob(chunks, {type: "video/mp4"}));
    }
    return offlineVideoURL;
  }
  window.addEventListener("pagehide", () => {
    if (offlineVideoURL) {
      URL.revokeObjectURL(offlineVideoURL);
      offlineVideoURL = undefined;
      demoVideo.removeAttribute("src");
    }
  });
  async function playDemoVideo() {
    setPlaying(false);
    $("#videoError").hidden = true;
    $("#playVideo").hidden = true;
    demoVideo.controls = true;
    try {
      if (!demoVideo.getAttribute("src") || demoVideo.error) {
        // Attach the MP4 only after an explicit play action, including offline exports.
        demoVideo.src = demoVideoSource();
        demoVideo.load();
      }
      await demoVideo.play();
    } catch (error) {
      if (error.name !== "AbortError") {
        $("#playVideo").hidden = false;
        $("#videoError").hidden = false;
      }
    }
  }
  $$("[data-start-video]").forEach((button) =>
    button.addEventListener("click", playDemoVideo),
  );
  demoVideo.addEventListener("play", () => setPlaying(false));
  demoVideo.addEventListener("error", () => {
    $("#playVideo").hidden = false;
    $("#videoError").hidden = false;
  });
  $$("[data-open-deploy]").forEach((b) =>
    b.addEventListener("click", () => setSetup("runtime")),
  );
  $("#fullScreen").addEventListener("click", async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await $("#taskPanel").requestFullscreen();
    } catch {
      toast(
        tr("fullScreen") +
          ": " +
          (state.lang === "zh"
            ? "请使用浏览器全屏"
            : "use browser full screen"),
      );
    }
  });
  $("#openEvidence").addEventListener("click", () => {
    setPlaying(false);
    state.evidenceIndex = Math.max(0, currentIndex());
    renderEvidence();
    $("#evidenceDialog").showModal();
  });
  $("#closeEvidence").addEventListener("click", () =>
    $("#evidenceDialog").close(),
  );
  $("#evidenceList").addEventListener("click", (event) => {
    const b = event.target.closest("[data-evidence-index]");
    if (b) {
      state.evidenceIndex = +b.dataset.evidenceIndex;
      renderEvidence();
    }
  });
  $("#evidenceDialog").addEventListener("click", (event) => {
    if (event.target !== $("#evidenceDialog")) return;
    const r = event.target.getBoundingClientRect();
    if (
      event.clientX < r.left ||
      event.clientX > r.right ||
      event.clientY < r.top ||
      event.clientY > r.bottom
    )
      event.target.close();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      setPlaying(false);
      demoVideo.pause();
    }
  });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) =>
          entry.target.classList.toggle("offscreen", !entry.isIntersecting),
        ),
      { rootMargin: "100px" },
    ).observe($("#machine"));
  }
  applyLanguage(state.lang);
  setHardware(state.hardware);
  window.LocalDeployment = {
    state,
    seek,
    setPlaying,
    setHardware,
    setSetup,
    applyLanguage,
    duration,
    evidence: E,
  };
})();
