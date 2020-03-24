import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';

import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';

import { elements, renderLoader, clearLoader } from './views/base';

/*
Globalno stanje aplikacije
1) Trazenje objekta
2) Current recipe object
3) Liked recipes
*/
const state = {};

/*
SEARCH KONTROLER
*/

const controlSearch = async () => {
    // 1) Dobijanje upita iz view-a
    const query = searchView.getInput();

    if (query) {
        // 2) Novi search object i add u state
        state.search = new Search(query);

        // 3) Priprema UI za rezultate
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes);

        try {
            // 4) Trazenje recepata
            await state.search.getResults();

            // 5) renderovanje rezultata na UI
            clearLoader();
            searchView.renderResults(state.search.result); // po difoltu prikazuje stranu 1, ne mora da se stavlja (,1 ) kao drugi parametar
        } catch (err) {
            alert('Something wrong with the search...');
            clearLoader();
        }
    }
}

elements.searchForm.addEventListener('submit', e => {
    e.preventDefault();
    controlSearch();
});

//testiranje
// window.searchForm.addEventListener(';pad', e => {
//     e.preventDefault();
//     controlSearch();
// });

// search.getResults();

elements.searchResPages.addEventListener('click', e => {
    const btn = e.target.closest('.btn-inline'); // sluzi da ceo button bude link 
    if (btn) {
        const goToPage = parseInt(btn.dataset.goto, 10);
        searchView.clearResults();
        searchView.renderResults(state.search.result, goToPage);
    }
});

/*
RECEPT KONTROLER
*/

const controlRecipe = async () => {
    // Dobijanje id-a iz URL-a
    const id = window.location.hash.replace('#', '');

    if (id) {
        // Priprema UI za promene
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        // Oznacavanje selektovanog search sadrzaja
        if (state.search) searchView.highlightSelected(id);

        // Pravljenje novog recipe objekta
        state.recipe = new Recipe(id);

        //tesiranje
        // window.r = state.recipe;

        try {
            // Dobijanje recept data i parsiranje sastojaka
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();

            // Izracunavanje serviranja i vremena
            state.recipe.calcTime();
            state.recipe.calcServings();

            // Render recepta            
            clearLoader();
            recipeView.renderRecipe(
                state.recipe,
                state.likes.isLiked(id)
            );

        } catch (err) {
            alert('Error processing recipe!')
        }
    }
};
// window.addEventListener('hashchange', controlRecipe);
// window.addEventListener('load', controlRecipe);

// U stvari, bolje je ovako preko forEach-a
['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));

/*
LIST KONTROLER
*/
const controlList = () => {
    // Kreiranje nove liste ako je vec nema
    if (!state.list) state.list = new List();

    // Dodavanje svakog sastojka listi i UI
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item); //prosledjuje se iz listView!
    });
}

// Upravljanje delete i update listom item dogadjajima
elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;

    //Upravljanje delete button-om
    if (e.target.matches('.shopping__delete, .shopping__delete *')) {
        //Brisanje iz state-a
        state.list.deleteItem(id);

        //Brisanje iz UI
        listView.deleteItem(id);

        //Upravljanje count update-om
        } else if (e.target.matches('.shopping__count-value')) {
            const val = parseFloat(e.target.value, 10);
            state.list.updateCount(id, val);
        }
    });

/*
LIKE KONTROLER
*/
// Testiranje
// state.likes = new Likes();
// likes.toggleLikeMenu(state.likes.getNumLikes());

const controlLike = () => {
    if (!state.likes) state.likes = new Likes();
    const currentID = state.recipe.id;

    //Korisnik jos nije lajkovao trenutni recept
    if (!state.likes.isLiked(currentID)) {
        // Dodati like u state
        const newLike = state.likes.addLike(
            currentID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img
        );
        // Ukljuci like dugme
        likesView.toggleLikeBtn(true);

        //Dodati like u UI listu
        likesView.renderLike(newLike);

        //Korisnik je lajkovao trenutni recept  
        } else {
        // Dodati like u state
        state.likes.deleteLike(currentID);

        // Iskljuci like dugme
        likesView.toggleLikeBtn(false);
        //Izbrisati like u UI liste
        likesView.deleteLike(currentID);
    }
    likesView.toggleLikeMenu(state.likes.getNumLikes());
};

//Vracanje lajkovanih recepte na ucitavane stanice
window.addEventListener('load', () => {
    state.likes = new Likes();

    //Vracanje lajkova
    state.likes.readStorage();

    //Prekidac za like menu dugme
    likesView.toggleLikeMenu(state.likes.getNumLikes());

    //Prikaz postojecih lajkova
    state.likes.likes.forEach(like => likesView.renderLike(like));
});

// Upravljanje recept button klikovima
elements.recipe.addEventListener('click', e => {
    if (e.target.matches('.btn-decrease, .btn-decrease *')) {
        // Decrease button je kliknuto
        if (state.recipe.servings > 1) {
            state.recipe.updateServings('dec');
            recipeView.updateServingsIngredients(state.recipe);
        }
    }
    else if (e.target.matches('.btn-increase, .btn-increase *')) {
        // Increase button je kliknuto
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);
    } else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
        // Dodavanje sastojaka u soping listu
        controlList();
    } else if (e.target.matches('.recipe__love, .recipe__love *')) {
        // Like kontroler
        controlLike();
    }
});

// window.l = new List();