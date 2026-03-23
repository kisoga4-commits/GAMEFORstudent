import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { auth } from "./firebase.js";
import { populateLevelForm, clearLevelForm, getLevelInputFromForm } from "./components/levelForm.js";
import { LEVEL_STATUS } from "./models/levelModel.js";
import { getPlayerProfile } from "./services/player.js";
import {
  createLevel,
  deleteLevel,
  listLevelsForAdmin,
  seedSampleLevels,
  toggleLevelStatus,
  updateLevel
} from "./services/levelsAdmin.js";

const levelForm = document.getElementById("levelForm");
const levelsTableBody = document.getElementById("levelsTableBody");
const statusMessage = document.getElementById("statusMessage");
const refreshBtn = document.getElementById("refreshBtn");
const resetBtn = document.getElementById("resetBtn");
const seedBtn = document.getElementById("seedBtn");
const searchInput = document.getElementById("searchInput");
const formModeText = document.getElementById("formModeText");

let allLevels = [];
let editingLevelId = "";
let canManageLevels = false;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "./index.html";
    return;
  }

  try {
    setStatus("กำลังตรวจสอบสิทธิ์...");
    const profile = await getPlayerProfile(user.uid);

    if (!profile?.characterName) {
      setStatus("ไม่พบข้อมูลผู้เล่น กลับหน้าเข้าเกม", true);
      setTimeout(() => {
        window.location.href = "./index.html";
      }, 900);
      return;
    }

    canManageLevels = Boolean(profile.isAdmin);

    if (!canManageLevels) {
      setStatus("บัญชีนี้ยังไม่มีสิทธิ์แอดมิน (ตั้งค่า isAdmin=true ใน players/{uid})", true);
    }

    bindEvents();
    await loadAndRenderLevels();
    clearLevelForm(levelForm);
    setFormMode("create");
  } catch (error) {
    console.error(error);
    setStatus("โหลดหน้าแอดมินไม่สำเร็จ", true);
  }
});

function bindEvents() {
  levelForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!guardAdmin()) {
      return;
    }

    try {
      setLoading(true);
      const levelInput = getLevelInputFromForm(levelForm);

      if (editingLevelId) {
        const updatedLevelId = await updateLevel({
          originalLevelId: editingLevelId,
          levelInput
        });

        setStatus(`แก้ไขด่าน ${updatedLevelId} สำเร็จ`);
      } else {
        const createdLevelId = await createLevel(levelInput);
        setStatus(`เพิ่มด่านใหม่ ${createdLevelId} สำเร็จ`);
      }

      clearLevelForm(levelForm);
      setFormMode("create");
      await loadAndRenderLevels(searchInput?.value || "");
    } catch (error) {
      console.error(error);
      setStatus(error.message || "บันทึกด่านไม่สำเร็จ", true);
    } finally {
      setLoading(false);
    }
  });

  refreshBtn?.addEventListener("click", async () => {
    await loadAndRenderLevels(searchInput?.value || "");
    setStatus("รีเฟรชข้อมูลด่านแล้ว");
  });

  resetBtn?.addEventListener("click", () => {
    clearLevelForm(levelForm);
    setFormMode("create");
    setStatus("ล้างฟอร์มเรียบร้อย");
  });

  seedBtn?.addEventListener("click", async () => {
    if (!guardAdmin()) {
      return;
    }

    try {
      setLoading(true);
      const count = await seedSampleLevels();
      await loadAndRenderLevels(searchInput?.value || "");
      setStatus(`เพิ่มข้อมูลตัวอย่าง ${count} ด่านเรียบร้อย`);
    } catch (error) {
      console.error(error);
      setStatus("เพิ่มข้อมูลตัวอย่างไม่สำเร็จ", true);
    } finally {
      setLoading(false);
    }
  });

  searchInput?.addEventListener("input", () => {
    renderLevelsTable(searchInput.value || "");
  });

  levelsTableBody?.addEventListener("click", async (event) => {
    const actionButton = event.target.closest("button[data-action]");

    if (!actionButton || !guardAdmin()) {
      return;
    }

    const action = actionButton.dataset.action;
    const levelId = actionButton.dataset.levelId;

    if (!action || !levelId) {
      return;
    }

    try {
      setLoading(true);

      if (action === "edit") {
        const target = allLevels.find((level) => level.levelId === levelId);

        if (!target) {
          throw new Error("ไม่พบข้อมูลด่านที่เลือก");
        }

        populateLevelForm(levelForm, target);
        setFormMode("edit", target.levelId);
        setStatus(`กำลังแก้ไข ${target.levelId}`);
        return;
      }

      if (action === "delete") {
        const shouldDelete = window.confirm(`ยืนยันลบด่าน ${levelId}?`);

        if (!shouldDelete) {
          return;
        }

        await deleteLevel(levelId);
        setStatus(`ลบด่าน ${levelId} เรียบร้อย`);
      }

      if (action === "toggle") {
        const currentStatus = actionButton.dataset.currentStatus;
        const nextStatus = currentStatus === LEVEL_STATUS.ACTIVE ? LEVEL_STATUS.INACTIVE : LEVEL_STATUS.ACTIVE;

        await toggleLevelStatus(levelId, nextStatus);
        setStatus(`อัปเดตสถานะ ${levelId} เป็น ${nextStatus} แล้ว`);
      }

      await loadAndRenderLevels(searchInput?.value || "");
    } catch (error) {
      console.error(error);
      setStatus(error.message || "อัปเดตด่านไม่สำเร็จ", true);
    } finally {
      setLoading(false);
    }
  });
}

async function loadAndRenderLevels(searchText = "") {
  allLevels = await listLevelsForAdmin();
  renderLevelsTable(searchText);
}

function renderLevelsTable(searchText) {
  const keyword = String(searchText || "")
    .trim()
    .toLowerCase();

  const visibleLevels = allLevels.filter((level) => {
    if (!keyword) {
      return true;
    }

    return (
      level.levelId.toLowerCase().includes(keyword) ||
      level.title.toLowerCase().includes(keyword)
    );
  });

  levelsTableBody.innerHTML = "";

  if (visibleLevels.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML = '<td colspan="7" class="table-empty">ไม่พบด่านที่ค้นหา</td>';
    levelsTableBody.appendChild(row);
    return;
  }

  const fragment = document.createDocumentFragment();

  visibleLevels.forEach((level) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${level.worldId || "-"}</td>
      <td>${level.levelId}</td>
      <td>${level.title || "-"}</td>
      <td>${level.difficultyRank}</td>
      <td>${level.mapType || "-"}</td>
      <td><span class="status-pill ${level.status === "active" ? "status-pill-active" : "status-pill-inactive"}">${level.status}</span></td>
      <td class="table-actions">
        <button type="button" class="btn-small" data-action="edit" data-level-id="${level.levelId}">แก้ไข</button>
        <button type="button" class="btn-small btn-secondary" data-action="toggle" data-level-id="${level.levelId}" data-current-status="${level.status}">
          ${level.status === "active" ? "ปิดด่าน" : "เปิดด่าน"}
        </button>
        <button type="button" class="btn-small btn-danger" data-action="delete" data-level-id="${level.levelId}">ลบ</button>
      </td>
    `;
    fragment.appendChild(row);
  });

  levelsTableBody.appendChild(fragment);
}

function setFormMode(mode, levelId = "") {
  editingLevelId = mode === "edit" ? levelId : "";

  if (formModeText) {
    formModeText.textContent =
      mode === "edit" ? `โหมดแก้ไข: ${levelId}` : "โหมดเพิ่มด่านใหม่";
  }
}

function setLoading(isLoading) {
  const submitBtn = levelForm?.querySelector('button[type="submit"]');

  if (submitBtn) {
    submitBtn.disabled = isLoading;
    submitBtn.textContent = isLoading ? "กำลังบันทึก..." : editingLevelId ? "บันทึกการแก้ไข" : "เพิ่มด่าน";
  }

  [refreshBtn, resetBtn, seedBtn].forEach((button) => {
    if (button) {
      button.disabled = isLoading;
    }
  });
}

function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("status-error", isError);
  statusMessage.classList.toggle("status-success", !isError && Boolean(message));
}

function guardAdmin() {
  if (canManageLevels) {
    return true;
  }

  setStatus("บัญชีนี้ไม่มีสิทธิ์จัดการด่าน (isAdmin=true)", true);
  return false;
}
