import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { auth } from "./firebase.js";
import { getPlayerProfile } from "./services/player.js";
import { listLevels, upsertLevel } from "./services/levels.js";

const levelForm = document.getElementById("levelForm");
const refreshBtn = document.getElementById("refreshBtn");
const levelsTableBody = document.getElementById("levelsTableBody");
const statusMessage = document.getElementById("statusMessage");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "./index.html";
    return;
  }

  try {
    setStatus("กำลังตรวจสอบผู้เล่น...");
    const profile = await getPlayerProfile(user.uid);

    if (!profile?.characterName) {
      setStatus("ไม่พบข้อมูลผู้เล่น กลับหน้าเข้าเกม", true);
      setTimeout(() => {
        window.location.href = "./index.html";
      }, 900);
      return;
    }

    bindEvents();
    await renderLevelsTable();
    setStatus("พร้อมจัดการด่าน");
  } catch (error) {
    console.error(error);
    setStatus("โหลดหน้าแอดมินไม่สำเร็จ", true);
  }
});

function bindEvents() {
  levelForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(levelForm);
    const levelId = String(formData.get("levelId") || "").trim();

    if (!levelId) {
      setStatus("กรุณาระบุ levelId", true);
      return;
    }

    try {
      setStatus("กำลังบันทึกด่าน...");
      setLoading(true);

      await upsertLevel({
        levelId,
        title: formData.get("title"),
        description: formData.get("description"),
        question: formData.get("question"),
        answer: formData.get("answer"),
        order: formData.get("order"),
        isPublished: formData.get("isPublished") === "on"
      });

      levelForm.reset();
      await renderLevelsTable();
      setStatus(`บันทึกด่าน ${levelId} สำเร็จ`);
    } catch (error) {
      console.error(error);
      setStatus("บันทึกด่านไม่สำเร็จ", true);
    } finally {
      setLoading(false);
    }
  });

  refreshBtn?.addEventListener("click", async () => {
    await renderLevelsTable();
  });
}

async function renderLevelsTable() {
  const levels = await listLevels({ includeDraft: true });

  levelsTableBody.innerHTML = "";

  if (levels.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML = '<td colspan="5" class="table-empty">ยังไม่มีข้อมูลด่านใน Firestore</td>';
    levelsTableBody.appendChild(row);
    return;
  }

  const fragment = document.createDocumentFragment();

  levels.forEach((level) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${level.id}</td>
      <td>${level.order ?? "-"}</td>
      <td>${level.title || "-"}</td>
      <td>${level.question || "-"}</td>
      <td>${level.isPublished ? "เผยแพร่" : "ฉบับร่าง"}</td>
    `;
    fragment.appendChild(row);
  });

  levelsTableBody.appendChild(fragment);
}

function setLoading(isLoading) {
  const submitBtn = levelForm?.querySelector('button[type="submit"]');

  if (submitBtn) {
    submitBtn.disabled = isLoading;
    submitBtn.textContent = isLoading ? "กำลังบันทึก..." : "บันทึกด่าน";
  }
}

function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("status-error", isError);
  statusMessage.classList.toggle("status-success", !isError && Boolean(message));
}
