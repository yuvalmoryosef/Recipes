require("dotenv").config();
const sql = require("mssql");
const axios = require("axios");
const api_domain = "https://api.spoonacular.com/recipes";

const config = {
  user: process.env.tedious_userName,
  password: process.env.tedious_password,
  server: process.env.tedious_server,
  database: process.env.tedious_database,
  connectionTimeout: 1500000,
  options: {
    encrypt: true,
    enableArithAbort: true,
  },
};

const pool = new sql.ConnectionPool(config);
const poolConnect = pool
  .connect()
  .then(() => console.log("new connection pool Created"))
  .catch((err) => console.log(err));

execQuery = async function (query) {
  await poolConnect;
  try {
    var result = await pool.request().query(query);
    return result.recordset;
  } catch (err) {
    console.error("SQL error", err);
    throw err;
  }
};

function getRecipeInfo(id) {
  return axios.get(`${api_domain}/${id}/information`, {
    params: {
      includeNutrition: false,
      apiKey: process.env.spooncular_apiKey,
    },
  });
}

async function getRecipeInfoPreview(recipe_id) {
  recipePreview = await getRecipeInfo(recipe_id);
  const {
    id,
    title,
    readyInMinutes,
    aggregateLikes,
    vegetarian,
    vegan,
    glutenFree,
    image,
  } = recipePreview.data;
  return {
    id: id,
    title: title,
    readyInMinutes: readyInMinutes,
    aggregateLikes: aggregateLikes,
    vegetarian: vegetarian,
    vegan: vegan,
    glutenFree: glutenFree,
    image: image,
  };
}

async function getRandomRecipeInfo() {
  const random_recepies = await axios.get(`${api_domain}/random`, {
    params: {
      number: 3,
      apiKey: process.env.spooncular_apiKey,
    },
  });
  let randRecepie = random_recepies.data.recipes; //.map((recipe)=>{
  for (let i = 0; i < 3; i++) {
    if (randRecepie[i].instructions != "") {
      randRecepie[i] = await getRecipeInfoPreview(randRecepie[i].id);
    } else randRecepie[i] = undefined;
  }
  return randRecepie;
}

async function getRecipeInfoFull(recipe_id) {
  recipeFull = await getRecipeInfo(recipe_id);
  const {
    id,
    title,
    readyInMinutes,
    aggregateLikes,
    vegetarian,
    vegan,
    glutenFree,
    image,
    servings,
    extendedIngredients,
    analyzedInstructions,
  } = recipeFull.data;

  return {
    data: {
      id: id,
      title: title,
      readyInMinutes: readyInMinutes,
      aggregateLikes: aggregateLikes,
      vegetarian: vegetarian,
      vegan: vegan,
      glutenFree: glutenFree,
      image: image,
      servings: servings,
      ingridients: getIngridients(extendedIngredients),
      instructions: getSteps(analyzedInstructions),
    },
  };
}
function getIngridients(extendedIngredients) {
  let ingridiendstrings = new Array(extendedIngredients.length);
  for (i in extendedIngredients) {
    /*     ingridiendstrings[i] =
      "ingredient_name: " +
      extendedIngredients[i].name +
      ", " +
      "amount: " +
      extendedIngredients[i].amount +
      ", " +
      "unit: " +
      extendedIngredients[i].unit; */
    ingridiendstrings[i] =
      extendedIngredients[i].name +
      " - " +
      extendedIngredients[i].amount +
      "   " +
      extendedIngredients[i].unit;
  }
  return ingridiendstrings;
}

function getSteps(analyzedInstructions) {
  let instructions = new Map();
  let k = 1;
  for (i in analyzedInstructions) {
    for (j in analyzedInstructions[i].steps) {
      instructions[k] = analyzedInstructions[i].steps[j].step;
      k++;
    }
  }
  return instructions;
}

module.exports = {
  execQuery: execQuery,
  getRecipeInfo: getRecipeInfo,
  getRecipeInfoFull: getRecipeInfoFull,
  getIngridients: getIngridients,
  getSteps: getSteps,
  getRecipeInfoPreview: getRecipeInfoPreview,
  getRandomRecipeInfo: getRandomRecipeInfo,
};
