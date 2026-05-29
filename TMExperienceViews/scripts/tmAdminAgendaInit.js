import { formatAgendaTime } from "./tmAgendaInit.js";

const ADMIN_SECTIONS = [
  { beforeIndex: 0, label: "Opening" },
  { beforeIndex: 6, label: "Speeches" },
  { beforeIndex: 10, label: "Table topics" },
  { beforeIndex: 12, label: "Evaluations" },
  { beforeIndex: 17, label: "Closing" },
];

function extractRoleTitle(roleCell) {
  const strong = roleCell.querySelector("strong");
  return strong ? strong.textContent.trim() : roleCell.textContent.trim().split("\n")[0];
}

function extractRoleDetail(roleCell) {
  const clone = roleCell.cloneNode(true);
  clone.querySelectorAll("strong, input, select, br").forEach((node) => {
    if (node.tagName === "BR") node.replaceWith(document.createTextNode(" "));
    else node.remove();
  });
  return clone.textContent.replace(/\s+/g, " ").trim();
}

function extractDisplayTime(raw) {
  const firstChunk = raw.replace(/<br\s*\/?>/gi, "\n").split("\n")[0].trim();
  const cleaned = firstChunk.replace(/\s*\(end\)\s*$/i, "").trim();
  return formatAgendaTime(cleaned);
}

function getRoleAccentClass(roleTitle) {
  if (/^speaker\s*#/i.test(roleTitle)) return "tm-agenda-item--speech";
  if (/^evaluator\s*#/i.test(roleTitle)) return "tm-agenda-item--eval";
  return "";
}

function moveSpeakerFields(roleCell, fieldsHost) {
  roleCell.querySelectorAll("input[type='text']").forEach((input) => {
    const wrap = document.createElement("div");
    wrap.className = "tm-admin-field";
    const label = document.createElement("label");
    label.htmlFor = input.id;
    label.textContent = input.id.endsWith("Path")
      ? "Path / Project / Time"
      : "Project Title";
    wrap.appendChild(label);
    wrap.appendChild(input);
    fieldsHost.appendChild(wrap);
  });
}

export function buildAdminAgendaCards(tableSelector = "#agenda", listHostId = "tmAdminCards") {
  const table = document.querySelector(tableSelector);
  const listHost = document.getElementById(listHostId);
  if (!table || !listHost || listHost.dataset.ready === "1") return;

  const rows = table.querySelectorAll("tbody tr");
  listHost.innerHTML = "";
  listHost.className = "tm-agenda-list";

  rows.forEach((row, index) => {
    const section = ADMIN_SECTIONS.find((entry) => entry.beforeIndex === index);
    if (section) {
      const heading = document.createElement("h2");
      heading.className = "tm-agenda-section";
      heading.textContent = section.label;
      listHost.appendChild(heading);
    }

    const cells = row.querySelectorAll("td");
    if (cells.length < 3) return;

    const time = extractDisplayTime(cells[0].innerHTML || cells[0].textContent);
    const roleTitle = extractRoleTitle(cells[1]);
    const detail = extractRoleDetail(cells[1]);
    const memberCell = cells[2];
    const select = memberCell.querySelector("select");
    const copyTarget = memberCell.id;

    const item = document.createElement("article");
    item.className = `tm-agenda-item tm-admin-card ${getRoleAccentClass(roleTitle)}`.trim();
    if (select?.id) item.dataset.roleId = select.id;

    const top = document.createElement("div");
    top.className = "tm-admin-card-top";
    top.innerHTML = `
      <span class="tm-agenda-time"></span>
      <div class="tm-agenda-body">
        <div class="tm-agenda-head">
          <strong class="tm-agenda-role"></strong>
          <span class="tm-admin-member-slot"></span>
        </div>
      </div>
    `;
    top.querySelector(".tm-agenda-time").textContent = time;
    top.querySelector(".tm-agenda-role").textContent = roleTitle;

    const memberSlot = top.querySelector(".tm-admin-member-slot");
    const detailPanel = document.createElement("div");
    detailPanel.className = "tm-agenda-detail tm-admin-card-detail";

    if (detail) {
      const detailText = document.createElement("p");
      detailText.className = "tm-admin-card-detail__text";
      detailText.textContent = detail;
      detailPanel.appendChild(detailText);
    }

    if (select) {
      select.classList.add("tm-admin-member-select");
      memberSlot.appendChild(select);
      select.addEventListener("change", () => {
        item.classList.toggle("is-incomplete", !select.value.trim());
      });
    } else if (copyTarget) {
      const value = document.createElement("span");
      value.className = "tm-agenda-member";
      value.id = `${copyTarget}Display`;
      value.textContent = memberCell.textContent.trim() || "Unassigned";
      memberSlot.appendChild(value);
    } else {
      const value = document.createElement("span");
      value.className = "tm-agenda-member";
      value.textContent = memberCell.textContent.trim() || "Unassigned";
      memberSlot.appendChild(value);
    }

    const speakerFields = document.createElement("div");
    speakerFields.className = "tm-admin-item__speaker-fields";
    moveSpeakerFields(cells[1], speakerFields);
    if (speakerFields.childElementCount) detailPanel.appendChild(speakerFields);

    item.appendChild(top);
    if (detailPanel.childElementCount) item.appendChild(detailPanel);
    listHost.appendChild(item);
  });

  listHost.dataset.ready = "1";
}

export function setAdminCardsEditable(enabled) {
  document.querySelectorAll("#tmAdminCards select, #tmAdminCards input").forEach((el) => {
    el.disabled = !enabled;
  });
  document.getElementById("tmAdminCards")?.classList.toggle("is-editing", enabled);
  document.body.classList.toggle("tm-admin-editing", enabled);
}

export function highlightIncompleteAdminRoles() {
  document.querySelectorAll("#tmAdminCards .tm-agenda-item[data-role-id]").forEach((item) => {
    const select = item.querySelector("select");
    item.classList.toggle("is-incomplete", !select?.value.trim());
  });
}

export function countIncompleteAdminRoles() {
  return document.querySelectorAll("#tmAdminCards .tm-agenda-item.is-incomplete").length;
}

export function buildAdminPreviewHtml() {
  const items = document.querySelectorAll("#tmAdminCards .tm-agenda-item");
  if (!items.length) return "<p>No agenda to preview yet.</p>";

  let html = '<div class="tm-agenda-list">';
  items.forEach((item) => {
    const time = item.querySelector(".tm-agenda-time")?.textContent || "";
    const role = item.querySelector(".tm-agenda-role")?.textContent || "";
    const select = item.querySelector("select");
    const staticText = item.querySelector(".tm-agenda-member")?.textContent || "";
    const linkedId = item.querySelector(".tm-agenda-member")?.id;
    let member = select?.value || staticText || "Unassigned";

    if (linkedId === "generalRoleCopyDisplay") {
      member = document.getElementById("generalRoleCopy")?.textContent.trim() || member;
    }
    if (linkedId === "tmRoleCopyDisplay") {
      member = document.getElementById("tmRoleCopy")?.textContent.trim() || member;
    }

    html += `
      <article class="tm-agenda-item">
        <div class="tm-admin-card-top">
          <span class="tm-agenda-time">${time}</span>
          <div class="tm-agenda-body">
            <div class="tm-agenda-head">
              <strong class="tm-agenda-role">${role}</strong>
              <span class="tm-agenda-member">${member}</span>
            </div>
          </div>
        </div>
      </article>
    `;
  });
  html += "</div>";
  return html;
}
