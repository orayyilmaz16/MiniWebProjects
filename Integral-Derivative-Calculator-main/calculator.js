
const math = require('mathjs');
const Algebrite = require('algebrite');


/**
 * Verilen matematiksel ifadenin türevini alır
 * @param {string} expr - Türevini almak istediğin ifade (örn: "x^2 + 3*x + 5")
 * @param {string} variable - Hangi değişkene göre türev alınacak (örn: "x")
 * @returns {string} - Türev ifadesi string olarak
 */

function getDerivative(expr, variable = 'x') {
  try {
    // Türevini al
    const derivative = math.derivative(expr, variable);

    // Daha okunabilir hale getir
    return math.simplify(derivative).toString();
  } catch (error) {
    return `Hata: Geçersiz ifade (${error.message})`;
  }
}


function getIntegral(expr, variable = 'x') {
  try {
    // Belirtilen değişkene göre integral al
    const result = Algebrite.integral(expr, variable);

    // Sonucu sadeleştir ve string olarak döndür
    return Algebrite.simplify(result).toString();
  } catch (error) {
    return `Hata: Geçersiz ifade (${error.message})`;
  }
}



// Kullanım örnekleri
console.log("Türev:");
console.log(getDerivative("x^2 + 3*x + 5"));   
console.log(getDerivative("sin(x)"));          
console.log(getDerivative("e^(2*x)", "x"));
console.log("\n");

console.log("İntegral:");
console.log(getIntegral('2 * x + 3'));
console.log(getIntegral("sin(x)"));     
console.log(getIntegral("e^(2*x)", "x"));
console.log("\n");



