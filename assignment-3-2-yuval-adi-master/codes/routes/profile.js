var express = require("express");
var router = express.Router();
const DButils = require("../modules/DButils");

router.use(function requireLogin(req, res, next) {
  if (!req.user_id) {
    next({ status: 401, message: "unauthorized - user did not loged in " });
  } else {
    next();
  }
});

//#region WATCHED.
router.get("/getIsWatchedRecipe", async (req, res, next) => {
  try {
    if (!req.query.recipe_id) throw { status: 400, message: "incorrect input" };
    const resipe = await DButils.execQuery(
      `SELECT recipe_id FROM ProfileRecipes WHERE
       recipe_id='${req.query.recipe_id}' AND user_id='${req.session.user_id}' AND isWatched='true' `
    );
    if (resipe.length == 0) {
      res.status(200).send("false");
    } else {
      res.status(200).send("true");
    }
  } catch (error) {
    next(error);
  }
});
router.get("/get3WatchedRecipes", async (req, res, next) => {
  try {
    const WatchedRecipes = await DButils.execQuery(
      `SELECT top (3) recipe_id FROM ProfileRecipes WHERE
       user_id='${req.session.user_id}'  AND isWatched='true' order by time desc`
    );
    let recipes = new Array();
    for (let i = 0; i < WatchedRecipes.length; i++) {
      let recipe_id = WatchedRecipes[i];
      let watRecipe = await DButils.getRecipeInfoPreview(recipe_id.recipe_id);

      recipes[i] = watRecipe;
    }
    res.status(200).send({ recipes });
  } catch (error) {
    next(error);
  }
});
router.get("/getAllWatchedRecipes", async (req, res, next) => {
  try {
    //all the recipes this user watched
    const watched = await DButils.execQuery(
      `SELECT recipe_id FROM ProfileRecipes WHERE user_id='${req.session.user_id}' AND isWatched='true'`
    );
    res.status(200).send(watched);
  } catch (error) {
    next(error);
  }
});
router.post("/addToWatchedRecipes", async (req, res, next) => {
  try {
    if (!req.body.recipe_id) throw { status: 400, message: "incorrect input" };

    const ids = await DButils.execQuery(
      `SELECT recipe_id FROM ProfileRecipes WHERE recipe_id='${req.body.recipe_id}' AND user_id='${req.session.user_id}' `
    );
    if (ids.length == 0) {
      //not yet in the DB -->need to add
      await DButils.execQuery(
        `INSERT INTO ProfileRecipes VALUES ('${req.body.recipe_id}','${req.session.user_id}', 'false', 'true', GETUTCDATE() )`
      );
    } else {
      await DButils.execQuery(
        `UPDATE ProfileRecipes SET time = GETUTCDATE(), isWatched='true'
         WHERE recipe_id='${req.body.recipe_id}' AND user_id='${req.session.user_id}' `
      );
    }

    res.status(200).send({ sucess: true, cookie_valid: req.username && 1 });
  } catch (error) {
    next(error);
  }
});
//#endregion

//#region FAVORITES
router.get("/getIsFavoriteRecipe", async (req, res, next) => {
  try {
    if (!req.query.recipe_id) throw { status: 400, message: "incorrect input" };
    const resipe = await DButils.execQuery(
      `SELECT recipe_id FROM ProfileRecipes WHERE
       isFavorite = 'true'AND recipe_id='${req.query.recipe_id}' AND user_id='${req.session.user_id}'`
    );
    if (resipe.length == 0) {
      res.status(200).send("false");
    } else {
      res.status(200).send("true");
    }
  } catch (error) {
    next(error);
  }
});
router.get("/getFavoritesRecipes", async (req, res, next) => {
  try {
    const favorites = await DButils.execQuery(
      `SELECT recipe_id FROM ProfileRecipes WHERE isFavorite = 'true' AND user_id='${req.session.user_id}'`
    );
    let recipes = new Array();
    for (let i = 0; i < favorites.length; i++) {
      let recipe_id = favorites[i];
      let favRecipe = await DButils.getRecipeInfoPreview(recipe_id.recipe_id);

      recipes[i] = favRecipe;
    }
    res.status(200).send({ recipes });
  } catch (error) {
    next(error);
  }
});
router.post("/addFavoritesRecipes", async (req, res, next) => {
  try {
    console.log(req.query.recipe_id);
    console.log(req.body.recipe_id);
    //if (!req.query.recipe_id) throw { status: 400, message: "incorrect input" };
    if (!req.body.recipe_id) throw { status: 400, message: "incorrect input" };
    const ids = await DButils.execQuery(
      `SELECT recipe_id FROM ProfileRecipes WHERE recipe_id='${req.body.recipe_id}' AND user_id='${req.session.user_id}' `
    );
    if (ids.length == 0) {
      //not yet in the DB -->need to add
      await DButils.execQuery(
        `INSERT INTO ProfileRecipes VALUES ('${req.body.recipe_id}','${req.session.user_id}', 'true', 'false', GETUTCDATE() )`
      );
    } else {
      await DButils.execQuery(
        `UPDATE ProfileRecipes SET isFavorite='true'
         WHERE recipe_id='${req.body.recipe_id}' AND user_id='${req.session.user_id}' `
      );
    }

    res.status(200).send({ sucess: true, cookie_valid: req.username && 1 });
  } catch (error) {
    next(error);
  }
});
router.post("/deleteFavoritesRecipes", async (req, res, next) => {
  try {
    if (!req.body.recipe_id) throw { status: 400, message: "incorrect input" };
    await DButils.execQuery(
      `UPDATE ProfileRecipes SET isFavorite = 'false' WHERE recipe_id='${req.body.recipe_id}' AND user_id='${req.session.user_id}'`
    );
    res.status(200).send({ sucess: true, cookie_valid: req.username && 1 });
  } catch (error) {
    next(error);
  }
});
//#endregion

//#region PERSONAL
router.get("/getMyRecipes", async (req, res, next) => {
  try {
    const recipes = await DButils.execQuery(
      `SELECT recipe_id, recipe_name, preperationTime, vegan, vegetarian,
     gluten_free FROM Recipes WHERE recipeType='personal' AND user_id='${req.session.user_id}'`
    );
    if (recipes.length == 0) {
      res.status(200).send("There is no personal recipes for this user");
    } else {
      let personalRecipes = new Array();
      for (let i = 0; i < recipes.length; i++) {
        let id = recipes[i].recipe_id;
        let title = recipes[i].recipe_name;
        let readyInMinutes = recipes[i].preperationTime;
        let aggregateLikes = 0;
        let vegetarian;
        if (recipes[i].vegetarian == "true") vegetarian = true;
        else vegetarian = false;
        let vegan;
        if (recipes[i].vegan == "true") vegan = true;
        else vegan = false;
        let glutenFree;
        if (recipes[i].glutenFree == "true") glutenFree = true;
        else glutenFree = false;
        let imageArr = await DButils.execQuery(
          `SELECT image_url FROM RecipesImages WHERE recipe_id='${recipes[i].recipe_id}'`
        );
        let image = imageArr[0].image_url;
        perRecipe = {
          id,
          title,
          readyInMinutes,
          aggregateLikes,
          vegetarian,
          vegan,
          glutenFree,
          image,
        };
        personalRecipes[i] = perRecipe;
        //recipe[i] = { recipe: recipes[i], image: image };
      }

      res.status(200).send({ personalRecipes });
    }
  } catch (error) {
    next(error);
  }
});
router.get("/getMyFullRecipe", async (req, res, next) => {
  try {
    const recipes = await DButils.execQuery(
      `SELECT recipe_id, recipe_name, preperationTime, vegan, vegetarian,
      gluten_free, servings FROM Recipes WHERE recipeType='personal' AND user_id='${req.session.user_id}' AND recipe_id='${req.query.recipe_id}'`
    );
    if (recipes.length == 0) {
      res.status(200).send("There is no personal recipes for this recipe id");
    } else {
      /*      let recipe_id = await DButils.execQuery(
         `SELECT recipe_id FROM Recipes WHERE recipe_name='${req.query.recipe_name}' `
       ); */
      let ingredients = await DButils.execQuery(
        `SELECT ingredient_name, amount, unit FROM Ingredients WHERE recipe_id='${req.query.recipe_id}'`
      );
      let instructions = await DButils.execQuery(
        `SELECT step_number, step_description FROM Instructions WHERE recipe_id='${req.query.recipe_id}'`
      );
      let image_out = await DButils.execQuery(
        `SELECT image_url FROM RecipesImages WHERE recipe_id='${req.query.recipe_id}'`
      );
      let id = recipes[0].recipe_id;
      let title = recipes[0].recipe_name;
      let readyInMinutes = recipes[0].preperationTime;
      let aggregateLikes = 0;
      let servings = recipes[0].servings;

      let vegetarian;
      if (recipes[0].vegetarian == "true") vegetarian = true;
      else vegetarian = false;
      let vegan;
      if (recipes[0].vegan == "true") vegan = true;
      else vegan = false;
      let glutenFree;
      if (recipes[0].glutenFree == "true") glutenFree = true;
      else glutenFree = false;
      let image = image_out[0].image_url;
      res.send({
        data: {
          id,
          title,
          readyInMinutes,
          aggregateLikes,
          vegetarian,
          vegan,
          glutenFree,
          image,
          ingredients,
          instructions,
          image,
          servings,
        },
      });
    }
  } catch (error) {
    next(error);
  }
});
//#endregion

//#region FAMILY
router.get("/getFullFamilyRecipe", async (req, res, next) => {
  try {
    const recipes = await DButils.execQuery(
      `SELECT recipe_id, recipe_name, preperationTime, vegan, vegetarian,
     gluten_free, servings, whoPrepare, whenPrepare FROM Recipes WHERE recipeType='family' AND user_id='${req.session.user_id}' AND recipe_id='${req.query.recipe_id}'`
    );
    /*    const recipes_names = await DButils.execQuery(
    `SELECT recipe_name FROM Recipes WHERE recipeType='family' AND user_id='${req.session.user_id}'`
  ); */

    if (recipes.length == 0) {
      res.status(200).send("There is no family recipes for this user");
    } else {
      let ingredients = await DButils.execQuery(
        `SELECT ingredient_name, amount, unit FROM Ingredients WHERE recipe_id='${req.query.recipe_id}'`
      );
      let instructions = await DButils.execQuery(
        `SELECT step_number, step_description FROM Instructions WHERE recipe_id='${req.query.recipe_id}'`
      );
      let image_out = await DButils.execQuery(
        `SELECT image_url FROM RecipesImages WHERE recipe_id='${req.query.recipe_id}'`
      );

      let id = recipes[0].recipe_id;
      let title = recipes[0].recipe_name;
      let readyInMinutes = recipes[0].preperationTime;
      let aggregateLikes = 0;
      let servings = recipes[0].servings;
      let vegetarian;
      if (recipes[0].vegetarian == "true") vegetarian = true;
      else vegetarian = false;
      let vegan;
      if (recipes[0].vegan == "true") vegan = true;
      else vegan = false;
      let glutenFree;
      if (recipes[0].glutenFree == "true") glutenFree = true;
      else glutenFree = false;
      let image = image_out[0].image_url;
      res.send({
        data: {
          id,
          title,
          readyInMinutes,
          aggregateLikes,
          vegetarian,
          vegan,
          glutenFree,
          image,
          ingredients,
          instructions,
          image,
          servings,
        },
      });
    }
  } catch (error) {
    next(error);
  }
});
router.get("/getFamilyRecipes", async (req, res, next) => {
  try {
    const recipes = await DButils.execQuery(
      `SELECT recipe_id, recipe_name, preperationTime, vegan, vegetarian,
     gluten_free, servings, whoPrepare, whenPrepare FROM Recipes WHERE recipeType='family' AND user_id='${req.session.user_id}'`
    );
    if (recipes.length == 0) {
      res.status(200).send("There is no family recipes for this user");
    } else {
      let familyRecipes = new Array();
      for (let i = 0; i < recipes.length; i++) {
        let id = recipes[i].recipe_id;
        let title = recipes[i].recipe_name;
        let readyInMinutes = recipes[i].preperationTime;
        let aggregateLikes = 0;
        let vegetarian;
        if (recipes[i].vegetarian == "true") vegetarian = true;
        else vegetarian = false;
        let vegan;
        if (recipes[i].vegan == "true") vegan = true;
        else vegan = false;
        let glutenFree;
        if (recipes[i].glutenFree == "true") glutenFree = true;
        else glutenFree = false;
        let servings = recipes[i].servings;
        let whoPrepare = recipes[i].whoPrepare;
        let whenPrepare = recipes[i].whenPrepare;

        let imageArr = await DButils.execQuery(
          `SELECT image_url FROM RecipesImages WHERE recipe_id='${recipes[i].recipe_id}'`
        );
        let image = imageArr[0].image_url;
        famRecipe = {
          id,
          title,
          readyInMinutes,
          aggregateLikes,
          vegetarian,
          vegan,
          glutenFree,
          servings,
          whoPrepare,
          whenPrepare,
          image,
        };
        familyRecipes[i] = famRecipe;
        //recipe[i] = { recipe: recipes[i], image: image };
      }

      res.status(200).send({ familyRecipes });
    }
  } catch (error) {
    next(error);
  }
});
//#endregion

//#region MEAL
/* 
router.get("/getMyMeal", async (req, res, next) => {
  try {
    const meal = await DButils.execQuery(
      `SELECT recipe_id, position FROM Meal WHERE user_id='${req.session.user_id}'`
    );
    res.status(200).send(meal);
  } catch (error) {
    next(error);
  }
});
router.post("/addRecipeToMeal", async (req, res, next) => {
  try {
    if (!req.query.recipe_id) throw { status: 400, message: "incorrect input" };
    await DButils.execQuery(
      `INSERT INTO Meal VALUES ( '${req.query.recipe_id}','${req.session.user_id}','${req.query.position}')`
    );
    res.status(200).send({ sucess: true, cookie_valid: req.username && 1 });
  } catch (error) {
    next(error);
  }
});
router.delete("/deleteRecipeFromMeal", async (req, res, next) => {
  try {
    if (!req.query.recipe_id) throw { status: 400, message: "incorrect input" };
    await DButils.execQuery(
      `DELETE FROM Meal WHERE recipe_id='${req.query.recipe_id}' AND user_id='${req.session.user_id}' `
    );
    res.status(200).send({ sucess: true, cookie_valid: req.username && 1 });
  } catch (error) {
    next(error);
  }
});
router.delete("/deleteMyMeal", async (req, res, next) => {
  try {
    await DButils.execQuery(
      `DELETE FROM Meal WHERE user_id='${req.session.user_id}' `
    );
    res.status(200).send({ sucess: true, cookie_valid: req.username && 1 });
  } catch (error) {
    next(error);
  }
});
router.post("/updeteRecipePosInMeal", async (req, res, next) => {
  try {
    if (!req.query.recipe_id || !req.query.position)
      throw { status: 400, message: "incorrect input" };
    await DButils.execQuery(
      `UPDATE Meal SET position='${req.query.position}' WHERE recipe_id='${req.query.recipe_id}' AND  user_id='${req.session.user_id}'`
    );
    res.status(200).send({ sucess: true, cookie_valid: req.username && 1 });
  } catch (error) {
    next(error);
  }
});
//#endregion
*/
function getRecipeInfoPersonal(id) {
  return axios.get(`${api_domain}/${id}/information`, {
    params: {
      includeNutrition: false,
      apiKey: process.env.spooncular_apiKey,
    },
  });
}

async function getRecipeInfoPreviewPersonal(recipe_id) {
  //recipePreview = await getRecipeInfo(recipe_id);
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

module.exports = router;
