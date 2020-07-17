let eventBus = new Vue();

Vue.component("movie-years", {
  props: {
    years: {
      type: Object,
    },
  },
  template: `
  <ul>
    <li v-for="(movieYear, index) in years" :key="movieYear+index+Math.random()">
      <input type="checkbox" class="m-1 bg-warning" @change='checkboxChanged(movieYear)'/> {{ movieYear }}
    </li>
  </ul>
  `,
  methods: {
    checkboxChanged: function (movieYear) {
      eventBus.$emit("year-checkbox-changed", movieYear);
      // alert(movieYear);
    },
  },
});

Vue.component("movie-modal", {
  props: {
    movie: {
      type: Object,
    },
  },
  template: `
  <div
        class="modal fade"
        id="movieModal"
        tabindex="-1"
        role="dialog"
        aria-labelledby="movieModalLabel"
        aria-hidden="true"
      >
  <div class="modal-dialog modal-lg" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="movieModalLabel">
          {{ movie.Title }}
          <a
            type="button"
            class="btn btn-warning"
            :href="url"
            target="_blank"
          >
            <strong class="text-dark">IMDb</strong>
            <span class="badge badge-light">{{ movie.imdbRating }}</span>
          </a>
        </h5>

        <button
          type="button"
          class="close"
          data-dismiss="modal"
          aria-label="Close"
        >
          <span aria-hidden="true" class="text-warning">&times;</span>
        </button>
      </div>
      <div class="modal-body row">
          <div class="col-md-3">
            <div
              class="card border-warning mb-3 poster-img-area"
              style="width: 220px; height: 316px;"
            >
              <img
                class="image img-thumbnail"
                :src="posterImage"
              />
            </div>
          </div>
          <hr class="horz-dot" />
          <div class="col-md-8 ml-md-5 modal-text">
          <div><h3 class='text-warning'>Plot</h3>{{ movie.Plot }}</div>
          <hr>
            <ul><li v-for="(value, key, index) in movieDetails"><span class='text-warning'>{{ key }}: </span> {{ value }}</li></ul>
          </div>
        </div>
      </div>
    </div>
  </div>
  `,
  computed: {
    posterImage: function () {
      if (this.movie.Poster == "N/A" || !this.movie.Poster)
        return "http://placeimg.com/220/316/any";
      return this.movie.Poster;
    },
    url: function () {
      return "http://imdb.com/title/" + this.movie.imdbID;
    },
    movieDetails: function () {
      return (({ Genre, Director, Production, Released, Writer, Actors }) => ({
        Genre,
        Director,
        Production,
        Released,
        Writer,
        Actors,
      }))(this.movie);
    },
  },
});

Vue.component("search-form", {
  template: `
  <form class="form-row" role="search" @submit.prevent="onSubmit">
    <div class="input-group">
      <input v-model="searchTitle"
        type="text"
        class="form-control col-md-10 mb-2 straight-right"
        placeholder="Movie Title"
      />

      <button class="btn btn-warning col-md-2 mb-2 straight-left" >Search</button>
    </div>
  </form>
  `,
  data() {
    return {
      searchTitle: "",
    };
  },
  methods: {
    onSubmit: function () {
      eventBus.$emit("get-movies", this.searchTitle);
    },
  },
});

Vue.component("movie-poster", {
  props: {
    movie: {
      type: Object,
      required: true,
    },
  },
  template: `
    <div class="poster col-md-3" @click="posterClicked(movie.imdbID)">
      <div class="card border-warning">
        <div class="dark-overlay"></div>
        <img
          class="image img-thumbnail"
          :src="posterImage"
        />
        <div class="middle btn-warning">
        <h4 class="title">{{ movie.Title }}<br />{{ movie.Year }}</h4>
        </div>
      </div>
    </div>
    `,
  computed: {
    posterImage: function () {
      if (this.movie.Poster == "N/A" || !this.movie.Poster)
        return "http://placeimg.com/220/316/any";
      return this.movie.Poster;
    },
  },
  methods: {
    posterClicked: function (id) {
      eventBus.$emit("poster-clicked", id);
    },
  },
});

let app = new Vue({
  el: "#app",
  data: {
    searchString: "",
    movies: {},
    movieYears: [],
    yearsForFiltering: {},
    filteredMovies: {},
    currentMovie: {},
  },
  watch: {
    movies: function () {
      // add all available years to object
      this.movieYears = [];
      this.filteredMovies = {};
      this.moviesList = this.movies;
      let foundYears = {};
      $.each(this.movies, (index, movie) => {
        foundYears[movie.Year] = movie.Year;
      });
      this.movieYears.push(foundYears);
    },
  },
  methods: {
    getMovies: function (title) {
      if (title != "" && this.searchString !== title) {
        axios
          .get("http://www.omdbapi.com/?apikey=ff0be5a3&s=" + title)
          .then((response) => {
            // console.log(response);
            this.movies = response.data.Search;
          })
          .catch((err) => {
            console.log(err);
          });
        this.searchString = title;
      }
    },
    getMovieDetails: function (movieId) {
      // console.log(movieId);
      axios
        .get("http://www.omdbapi.com/?apikey=ff0be5a3&i=" + movieId)
        .then((response) => {
          // console.log(response);
          this.currentMovie = response.data;
        })
        .catch((error) => console.log(error));
      $("#movieModal").modal("toggle");
    },
    filterMoviesByYear: function (filterYear) {
      // alert(filterYear);
      if (this.yearsForFiltering[filterYear]) {
        delete this.yearsForFiltering[filterYear];
        // alert("removed");
      } else {
        this.yearsForFiltering[filterYear] = filterYear;
        // alert("added");
      }

      this.filteredMovies = this.movies.filter((movie) => {
        return movie.Year in this.yearsForFiltering;
      });

      // console.log(this.filteredMovies);
    },
  },
  created() {
    eventBus.$on("get-movies", this.getMovies);
    eventBus.$on("poster-clicked", this.getMovieDetails);
    eventBus.$on("year-checkbox-changed", this.filterMoviesByYear);
    // console.log(this.movieYears[0]);
  },
  computed: {
    movieYearsList: function () {
      return this.movieYears[0];
    },
    moviesList: function () {
      if (Object.values(this.filteredMovies).length > 0) {
        return this.filteredMovies;
      } else {
        return this.movies;
      }
    },
  },
});
