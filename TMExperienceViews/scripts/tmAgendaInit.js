import { resolveAgendaMemberCell, DERIVED_AGENDA_MEMBER_BY_COPY_ID } from "./tmAgendaData.js?v=6";

function extractRoleTitle(roleCell) {
  const strong = roleCell.querySelector("strong");
  return strong ? strong.textContent.trim() : roleCell.textContent.trim().split("\n")[0];
}

function extractRoleDetail(roleCell) {
  const clone = roleCell.cloneNode(true);
  const strong = clone.querySelector("strong");
  if (strong) strong.remove();
  clone.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
  let html = clone.innerHTML.replace(/^[\s<br>]+/i, "").trim();
  return html;
}

export function formatAgendaTime(raw) {
  const trimmed = raw.trim();
  const match = trimmed.match(/^(\d{1,2}:\d{2})(?:\s*)?(AM|PM)?$/i);
  if (!match) return trimmed;

  const clock = match[1];
  const meridiem = (match[2] || "").toUpperCase();
  return meridiem ? `${clock} ${meridiem}` : clock;
}

const AGENDA_SECTIONS = [
  { beforeIndex: 0, label: "Opening" },
  { beforeIndex: 6, label: "Speeches" },
  { beforeIndex: 10, label: "Table topics" },
  { beforeIndex: 12, label: "Evaluations" },
  { beforeIndex: 17, label: "Closing" },
];

function getRoleAccentClass(roleTitle) {
  if (/^speaker\s*#/i.test(roleTitle)) return "tm-agenda-item--speech";
  if (/^evaluator\s*#/i.test(roleTitle)) return "tm-agenda-item--eval";
  return "";
}

function setMeetingTimeRange(rows) {
  const metaEl = document.getElementById("meetingTimeLbl");
  if (!metaEl || rows.length < 2) return;

  const first = rows[0].querySelector("td")?.textContent.trim();
  const last = rows[rows.length - 1].querySelector("td")?.textContent.trim();
  if (!first || !last) return;

  metaEl.textContent = `${formatAgendaTime(first)} – ${formatAgendaTime(last)}`;
}

export function initAgendaCards(tableSelector = ".tm-agenda-table") {
  const table = document.querySelector(tableSelector);
  const listHost = document.getElementById("tmAgendaCards");
  if (!table || !listHost || listHost.dataset.ready === "1") return;

  const rows = table.querySelectorAll("tbody tr");
  listHost.innerHTML = "";
  setMeetingTimeRange(rows);

  rows.forEach((row, index) => {
    const section = AGENDA_SECTIONS.find((entry) => entry.beforeIndex === index);
    if (section) {
      const heading = document.createElement("h2");
      heading.className = "tm-agenda-section";
      heading.textContent = section.label;
      listHost.appendChild(heading);
    }

    const cells = row.querySelectorAll("td");
    if (cells.length < 3) return;

    const time = formatAgendaTime(cells[0].textContent.trim());
    const roleTitle = extractRoleTitle(cells[1]);
    const detailHtml = extractRoleDetail(cells[1]);
    const memberCell = cells[2];
    const memberName = resolveAgendaMemberCell(memberCell);
    const isDerivedCopy = Boolean(DERIVED_AGENDA_MEMBER_BY_COPY_ID[memberCell.id]);
    const isUnassigned = !memberName && !isDerivedCopy;

    const item = document.createElement("article");
    item.className = `tm-agenda-item ${getRoleAccentClass(roleTitle)}`.trim();

    const rowBtn = document.createElement("button");
    rowBtn.type = "button";
    rowBtn.className = "tm-agenda-row";
    rowBtn.setAttribute("aria-expanded", "false");
    rowBtn.innerHTML = `
      <span class="tm-agenda-time"></span>
      <div class="tm-agenda-body">
        <div class="tm-agenda-head">
          <strong class="tm-agenda-role"></strong>
          <span class="tm-agenda-member"></span>
        </div>
      </div>
      <span class="tm-agenda-chevron" aria-hidden="true"></span>
    `;

    rowBtn.querySelector(".tm-agenda-time").textContent = time;
    rowBtn.querySelector(".tm-agenda-role").textContent = roleTitle;

    const memberEl = rowBtn.querySelector(".tm-agenda-member");
    memberEl.textContent = memberName || (isDerivedCopy ? "" : "Unassigned");
    if (isUnassigned) memberEl.classList.add("is-unassigned");

    const detail = document.createElement("div");
    detail.className = "tm-agenda-detail";
    detail.innerHTML = detailHtml || "No additional details.";

    rowBtn.addEventListener("click", () => {
      const open = item.classList.toggle("is-open");
      rowBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });

    item.appendChild(rowBtn);
    item.appendChild(detail);
    listHost.appendChild(item);

    if (index === 0) {
      item.classList.add("is-open");
      rowBtn.setAttribute("aria-expanded", "true");
    }
  });

  listHost.dataset.ready = "1";
}

export function refreshAgendaCards(tableSelector = ".tm-agenda-table") {
  const listHost = document.getElementById("tmAgendaCards");
  if (listHost) {
    delete listHost.dataset.ready;
  }
  initAgendaCards(tableSelector);
}
