(function () {
  try {
    var platformAcademyTheme = localStorage.getItem("platform-academy-theme");
    if (platformAcademyTheme === "dark" || platformAcademyTheme === "light") {
      document.documentElement.dataset.paTheme = platformAcademyTheme;
      document.documentElement.style.colorScheme = platformAcademyTheme;
    }
  } catch (error) {}
})();
