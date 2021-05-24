CREATE TABLE [dbo].[users](
	[user_id] [UNIQUEIDENTIFIER] PRIMARY KEY NOT NULL default NEWID(),
	[username] [varchar](30) NOT NULL UNIQUE,
	[password] [varchar](300) NOT NULL,
	[firstName] [varchar](30) NOT NULL,
	[lastName] [varchar](30) NOT NULL,
	[country] [varchar](30) NOT NULL,
	[email] [varchar](30) NOT NULL,
	[profilePicture] [varchar](500) NOT NULL

)
 
CREATE TABLE [dbo].[ProfileRecipes](
	[recipe_id] [int] NOT NULL,
	[user_id] [UNIQUEIDENTIFIER] NOT NULL,
	[isFavorite] [varchar](300) NOT NULL,
	[isWatched] [varchar](300) NOT NULL,
	[time] [datetime] NOT NULL,
	PRIMARY KEY (user_id, recipe_id),
	FOREIGN KEY (user_id) REFERENCES users(user_id)

)

CREATE TABLE [dbo].[Recipes](
	[recipe_id] [int] NOT NULL IDENTITY(1,1),
	[user_id] [UNIQUEIDENTIFIER] NOT NULL,
	[recipe_name] [varchar](300) NOT NULL,
	[preperationTime] [int] NOT NULL,
	[vegan] [varchar](300) NOT NULL,
	[vegetarian] [varchar](300) NOT NULL,
	[gluten_free] [varchar](300) NOT NULL,
	[servings] [int] NOT NULL,
	[recipeType] [varchar](300) NOT NULL,
	[whoPrepare] [varchar](300),
	[whenPrepare] [varchar](300),
	PRIMARY KEY (recipe_id,user_id),
	FOREIGN KEY (user_id) REFERENCES users(user_id)
)


 CREATE TABLE [dbo].[RecipesImages](
	[recipe_id] [int] NOT NULL,
	[user_id] [UNIQUEIDENTIFIER] NOT NULL,
	[image_url] [varchar](500) NOT NULL,
	PRIMARY KEY (recipe_id, user_id, image_url),
	FOREIGN KEY (recipe_id, user_id) REFERENCES Recipes(recipe_id, user_id)
)


CREATE TABLE [dbo].[Ingredients](
	[recipe_id] [int] NOT NULL,
	[user_id] [UNIQUEIDENTIFIER] NOT NULL,
	[ingredient_name] [varchar](500) NOT NULL,
	[amount] [varchar](300) NOT NULL,
	[unit] [varchar](300) NOT NULL,
	PRIMARY KEY (recipe_id, user_id, ingredient_name),
	FOREIGN KEY (recipe_id, user_id) REFERENCES Recipes(recipe_id, user_id)

)
CREATE TABLE [dbo].[Instructions](
	[recipe_id] [int] NOT NULL,
	[user_id] [UNIQUEIDENTIFIER] NOT NULL,
	[step_number] [varchar](300) NOT NULL,
	[step_description] [varchar](1000) NOT NULL,
	PRIMARY KEY (user_id, step_number, recipe_id),
	FOREIGN KEY (recipe_id, user_id) REFERENCES Recipes(recipe_id, user_id)

)
CREATE TABLE [dbo].[Meal](
	[recipe_id] [int] NOT NULL,
	[user_id] [UNIQUEIDENTIFIER] NOT NULL,
	[position] [int] NOT NULL,
	PRIMARY KEY (user_id, recipe_id),
	FOREIGN KEY (user_id,recipe_id) REFERENCES WatchedRecipes(user_id,recipe_id)

)
