// src/utils/auth.js
export const logoutAdmin = (navigate) => {
  // localStorage se admin flag hata
  localStorage.removeItem("bgmi_admin_logged_in");
  // optional: agar future me aur keys ho
  // localStorage.clear();

  // login page pe bhej
  navigate("/", { replace: true });
};
