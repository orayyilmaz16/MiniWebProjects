// script.js — Modern, clean, modular validation (no false emoji hits)

const EMOJI_REGEX = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/u;

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("myForm");
  const inputs = [...form.querySelectorAll("input")];

  inputs.forEach((input) => {
    inputs.forEach((input) => {
      input.addEventListener("input", () => {
        validateField(input);

        if (input.dataset.validate === "password") {
          updatePasswordMeter(input.value);
        }
      });

      input.addEventListener("blur", () => validateField(input));
    });

    input.addEventListener("blur", () => {
      if (input.dataset.validate === "text") {
        input.value = input.value
          .replace(/\s+/g, " ")
          .trim()
          .split(" ")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(" ");
      }
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const btn = document.querySelector(".btn-submit");
    if (btn.disabled) return;

    const allValid = inputs.every((i) => validateField(i));
    if (!allValid) return;

    btn.disabled = true;

    const data = getFormData(inputs);
    saveToLocalStorage(data);

    await fakeApi(data);
    showSuccessAnimation();

    form.reset();
    inputs.forEach(clearFieldState);
  });
});

/* -----------------------------
   Core validation
------------------------------ */
function validateField(input) {
  const type = input.dataset.validate; // "text" | "email" | "password"
  const wrapper = input.closest(".form-group");
  const errorMsg = wrapper.querySelector(".error-msg");
  const icon = wrapper.querySelector(".input-icon");

  const raw = input.value;
  const value = raw.trim();

  clearError(input, icon, errorMsg);

  if (!value) {
    return setError(input, icon, errorMsg, "This field cannot be empty");
  }

  // Field-specific validation
  if (type === "text") return validateName(input, value, icon, errorMsg);
  if (type === "email") return validateEmailField(input, value, icon, errorMsg);
  if (type === "password")
    return validatePassword(input, value, icon, errorMsg);

  return true;
}

/* -----------------------------
   Name
------------------------------ */
function validateName(input, value, icon, errorMsg) {
  // Emoji block
  if (EMOJI_REGEX.test(value)) {
    return setError(input, icon, errorMsg, "Emojis are not allowed");
  }

  // Only letters + spaces
  if (!/^[a-zA-ZğüşöçıİĞÜŞÖÇ\s]+$/.test(value)) {
    return setError(input, icon, errorMsg, "Name can only contain letters");
  }

  // Normalize spaces ONLY for validation
  const cleaned = value.replace(/\s+/g, " ").trim();
  const parts = cleaned.split(" ");

  // Require first + last name
  if (parts.length < 2) {
    return setError(
      input,
      icon,
      errorMsg,
      "Please enter your first and last name",
    );
  }

  // Each part min 2 chars
  if (parts.some((p) => p.length < 2)) {
    return setError(
      input,
      icon,
      errorMsg,
      "Each name must be at least 2 characters",
    );
  }

  return true;
}

/* -----------------------------
   Email
------------------------------ */
function validateEmailField(input, value, icon, errorMsg) {
  const email = value.toLowerCase();

  // Optional: block emoji in email too (won't catch numbers)
  if (EMOJI_REGEX.test(email)) {
    return setError(input, icon, errorMsg, "Emojis are not allowed");
  }

  if (/\s/.test(email)) {
    return setError(input, icon, errorMsg, "Email cannot contain spaces");
  }

  if (!validateEmail(email)) {
    return setError(input, icon, errorMsg, "Invalid email format");
  }

  input.value = email;
  return true;
}

/* -----------------------------
   Password
------------------------------ */
function validatePassword(input, value, icon, errorMsg) {
  // Optional: block emoji in password too (won't catch numbers)
  if (EMOJI_REGEX.test(value)) {
    return setError(input, icon, errorMsg, "Emojis are not allowed");
  }

  if (/\s/.test(value)) {
    return setError(input, icon, errorMsg, "Password cannot contain spaces");
  }

  if (value.length < 6) {
    return setError(
      input,
      icon,
      errorMsg,
      "Password must be at least 6 characters",
    );
  }

  if (!/[A-Z]/.test(value)) {
    return setError(
      input,
      icon,
      errorMsg,
      "Password must contain an uppercase letter",
    );
  }

  if (!/[0-9]/.test(value)) {
    return setError(input, icon, errorMsg, "Password must contain a number");
  }

  return true;
}

/* -----------------------------
   UI state helpers
------------------------------ */
function setError(input, icon, errorMsg, message) {
  input.classList.add("error");
  icon.classList.add("error-icon");
  errorMsg.textContent = message;
  return false;
}

function clearError(input, icon, errorMsg) {
  input.classList.remove("error");
  icon.classList.remove("error-icon");
  errorMsg.textContent = "";
}

function clearFieldState(input) {
  const wrapper = input.closest(".form-group");
  clearError(
    input,
    wrapper.querySelector(".input-icon"),
    wrapper.querySelector(".error-msg"),
  );
}

/* -----------------------------
   Utilities
------------------------------ */
function normalizeSpaces(str) {
  return str.replace(/\s+/g, " ").trim();
}

function toTitleCase(str) {
  return str
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getFormData(inputs) {
  return inputs.reduce((acc, input) => {
    acc[input.name] = input.value.trim();
    return acc;
  }, {});
}

function saveToLocalStorage(data) {
  localStorage.setItem("formData", JSON.stringify(data));
}

function fakeApi(data) {
  return new Promise((resolve) => {
    console.log("Sending to backend...", data);
    setTimeout(() => {
      console.log("Backend response: OK");
      resolve();
    }, 900);
  });
}

function showSuccessAnimation() {
  const btn = document.querySelector(".btn-submit");

  // Disable button
  btn.disabled = true;
  btn.classList.add("success");
  btn.innerHTML = `<i class="fa-solid fa-check"></i> Success`;

  setTimeout(() => {
    btn.classList.remove("success");
    btn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Submit`;

    // Enable again (istersen kaldırabilirsin)
    btn.disabled = false;
  }, 1500);
}

function updatePasswordMeter(password) {
  const fill = document.getElementById("pwFill");
  const label = document.getElementById("pwLabel");
  const tips = document.getElementById("pwTips");
  const meter = fill?.closest(".password-meter");

  if (!fill || !label || !tips || !meter) return;

  const { score, level, text, tip } = getPasswordStrength(password);

  // width mapping
  const widths = [0, 25, 50, 75, 100];
  fill.style.width = `${widths[score]}%`;

  // level classes
  meter.classList.remove("pw-weak", "pw-fair", "pw-good", "pw-strong");
  if (score === 1) meter.classList.add("pw-weak");
  if (score === 2) meter.classList.add("pw-fair");
  if (score === 3) meter.classList.add("pw-good");
  if (score === 4) meter.classList.add("pw-strong");

  label.textContent = `Strength: ${text}`;
  tips.textContent = tip;
}

function getPasswordStrength(pw) {
  const p = pw || "";
  const len = p.length;

  // If empty
  if (!p) return { score: 0, level: "none", text: "—", tip: "" };

  // Rules
  const hasLower = /[a-z]/.test(p);
  const hasUpper = /[A-Z]/.test(p);
  const hasDigit = /[0-9]/.test(p);
  const hasSymbol = /[^A-Za-z0-9]/.test(p);
  const hasSpace = /\s/.test(p);

  // Hard fails / tips
  if (hasSpace) {
    return { score: 1, level: "weak", text: "Weak", tip: "Remove spaces." };
  }

  // Score building (0–4)
  let score = 0;

  // length contribution
  if (len >= 6) score++;
  if (len >= 10) score++;

  // variety contribution
  const variety = [hasLower, hasUpper, hasDigit, hasSymbol].filter(
    Boolean,
  ).length;
  if (variety >= 2) score++;
  if (variety >= 3) score++;

  // clamp to 4
  score = Math.min(4, score);

  // Labels + tips
  if (score <= 1)
    return {
      score: 1,
      level: "weak",
      text: "Weak",
      tip: "Add length + uppercase + number.",
    };
  if (score === 2)
    return {
      score: 2,
      level: "fair",
      text: "Fair",
      tip: "Make it longer (10+) and add variety.",
    };
  if (score === 3)
    return {
      score: 3,
      level: "good",
      text: "Good",
      tip: "Add a symbol for extra strength.",
    };
  return { score: 4, level: "strong", text: "Strong", tip: "Looks solid." };
}
