(function (jsPDFAPI) {
  var font = "AAEAAA..."; // Base64-encoded font data
  var callAddFont = function () {
    this.addFileToVFS("Amiri-Regular.ttf", font);
    this.addFont("Amiri-Regular.ttf", "Amiri", "normal");
  };
  jsPDFAPI.events.push(["addFonts", callAddFont]);
})(jsPDF.API);
