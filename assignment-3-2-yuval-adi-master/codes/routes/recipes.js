var express = require("express");
var router = express.Router();
const axios = require("axios");
const DButils = require("../modules/DButils");

const api_domain = "https://api.spoonacular.com/recipes";

router.get("/displayFullRecipe", async (req, res, next) => {
  try {
    if (!req.query.recipe_id) throw { status: 400, message: "incorrect input" };
    const recipe = await DButils.getRecipeInfoFull(req.query.recipe_id);
    res.status(200).send({ data: recipe.data });
  } catch (error) {
    next(error);
  }
});
router.get("/search", async (req, res, next) => {
  try {
    let { query, cuisine, diet, intolerances, number } = req.query;
    if (number != 5 && number != 10 && number != 15) number = 5;
    const search_response = await axios.get(`${api_domain}/search`, {
      params: {
        query: query,
        cuisine: cuisine,
        diet: diet,
        intolerances: intolerances,
        number: number,
        instructionsRequired: true,
        apiKey: process.env.spooncular_apiKey,
      },
    });
    let recipes = await Promise.all(
      search_response.data.results.map((recipe_raw) =>
        DButils.getRecipeInfoPreview(recipe_raw.id)
      )
    );
    //recipes = recipes.map((recipe) => recipe.data);
    if (recipes.length == 0)
      throw { status: 400, message: "no recipes found for the search parms" };
    res.status(200).send({ data: recipes });
  } catch (error) {
    next(error);
  }
});
router.get("/random", async (req, res, next) => {
  try {
    let randRecipes = await DButils.getRandomRecipeInfo();
    while (
      randRecipes[0] === undefined ||
      randRecipes[1] === undefined ||
      randRecipes[2] === undefined
    ) {
      randRecipes = await DButils.getRandomRecipeInfo();
    }
    res.status(200).send({ randRecipes });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
