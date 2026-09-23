import Villager from './villagers.js';
import Trade from './trade.js';

const trade = new Trade();
const glasha = new Villager("Глаша", 2000);
const zina = new Villager("Зина", 1500);
const dasha = new Villager("Даша", 1000);
const petrov = new Villager("Петров", 5000);
glasha.inventory = {
    beets: 500,
    pears: 40
}
zina.inventory = {
    potatoes: 800,
    apples: 70
}
dasha.inventory = {
    nuts: 2000
}
petrov.inventory = {
    honey: 50
}
trade.exchange(glasha, zina, "beets", 50, "potatoes", 20);
trade.exchange(glasha, zina, "beets", 50, "toy", 20);
console.log("--- РЕЗУЛЬТАТ ОБМЕНА ---");
console.log("Инвентарь Глаши:", glasha.inventory);
console.log("Инвентарь Зины:", zina.inventory);
