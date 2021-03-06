const express = require('express');
const fs = require('fs');

var engine = require('consolidate');
const xray = require('x-ray');
const xr = xray();


					// IMPORTANT URLS //
//--------------------------------------------------------------------------------------------------------//
const base = 'http://www.barnesandnoble.com/b/';
const sort = '/_/N-1fZ29Zsoc?Ns=P_Sales_Rank';
const url = 'http://www.barnesandnoble.com/b/biography/_/N-1fZ29Zsoc?Ns=P_Sales_Rank';
const business = 'http://www.barnesandnoble.com/b/books/business/_/N-1fZ29Zsoc?Nrpp=20&Ns=P_Sales_Rank';
const religion = 'www.barnesandnoble.com/b/religion/_/N-1fZ29Z17d6?Ns=P_Sales_Rank';
const fiction = 'www.barnesandnoble.com/b/fiction/_/N-29Z10h8?Ns=P_Sales_Rank';
const search = 'http://www.barnesandnoble.com/s/';
//--------------------------------------------------------------------------------------------------------//
					// remove the 8q8z //




const app = express();
app.use(express.static(__dirname+'/client'));
app.set('views', __dirname + '/client/views');
app.engine('html', engine.mustache);
app.set('view engine', 'html');


/* 
 * scrapes all books on page and repeats by
 * n number of pages on each visited page
 */
function getBooks(query, pages){

    console.log("### scraping barnes and nobles ###");

     var search = 'http://www.barnesandnoble.com/s/' + query;
     
     
     xr(search, '.resultsListContainer li.clearer > ul > li', [{
	img: '.product-image img @src',
	title: '.product-info-title a',
	author: '.contributors a',
	description: xr('.product-info-title a@href', '#truncatedOverview p'),
        pages: xr('.product-info-title a@href', 'div[id=ProductDetailsTab] dl :nth-child(8)'),
        price: xr('.product-info-title a@href', 'p[class=price] span'),
	rating: 'span[class=gig-rating-stars]@title', 
        book_url: '.product-info-title a@href',
    }])(console.log) 
	.paginate('.search-pagination li:last-child a@href')
	.limit(1)
}


function getISBN(query){ 
     var book = xr(search + query , {
        tit: 'title',
	img: '#prodImage img @src',
	title: '#prodSummary h1[itemprop=name]',
	author: 'span[itemprop=author]',
	description: '#truncatedOverview p',
        pages: 'div[id=ProductDetailsTab] dl :nth-child(8)',
        price: 'p[class=price] span',
        isbn: 'div[id=ProductDetailsTab] dl :nth-child(2)',
        sales_rank: 'div[id=ProductDetailsTab] dl :nth-child(10)',
	rating: 'span[class=gig-rating-stars]@title', 
        book_url: '.product-info-title a@href',
    }) 

}

//getISBN('9781101996980');
//getBooks('dan', 1);

/*
 * returns all dictionary of all subjects and their unique url
 */
(function getGenres(){

    console.log("### scraping subjects of barnes and nobles ###");

    var hash = {};
    xr('http://www.barnesandnoble.com/h/books/browse', '.links-container.browse.clearer ul li ul li', [{
	subject: 'a',
	url: 'a@href',
    }])((err, obj) => {
	
	for(var i = 0; i < obj.length; i++) {
		console.log(obj[i].subject);
                console.log(obj[i].url);
	    }

  })
	//book.pipe(process.stdout)
});


/////////////////////////////////////// API ENDPOINTS /////////////////////////////////////////////////
app.get('/api/recent', (req, res) => {

     var dbooks = xr('http://www.barnesandnoble.com/b/new-releases/_/N-1oyg', '.resultsListContainer li.clearer > ul > li', [{
	img: '.product-image img @src',
	title: '.product-info-title a',
	author: '.contributors a',
	description: xr('.product-info-title a@href', '#truncatedOverview p'),
        pages: xr('.product-info-title a@href', 'div[id=ProductDetailsTab] dl :nth-child(8)'),
        price: xr('.product-info-title a@href', 'p[class=price] span'),
        isbn: xr('.product-info-title a@href' , 'div[id=ProductDetailsTab] dl :nth-child(2)'),
        sales_rank: xr('.product-info-title a@href', 'div[id=ProductDetailsTab] dl :nth-child(10)'),
	rating: 'span[class=gig-rating-stars]@title', 
        book_url: '.product-info-title a@href',
    }]) 
	.paginate('.search-pagination li:last-child a@href')
	.limit(1)
	.stream()

    dbooks.pipe(res);

});

app.get('/api/isbn/:number', (req, res) => {

    var url = search + req.params.number;   
  
     var book = xr( url , {
	img: '#prodImage img @src',
	title: '#prodSummary h1[itemprop=name]',
	author: 'span[itemprop=author]',
	description: '#truncatedOverview p',
        pages: 'div[id=ProductDetailsTab] dl :nth-child(8)',
        price: 'p[class=price] span',
        isbn: 'div[id=ProductDetailsTab] dl :nth-child(2)',
        sales_rank: 'div[id=ProductDetailsTab] dl :nth-child(10)',
	rating: 'span[class=gig-rating-stars]@title', 
        book_url: '.product-info-title a@href',
    }) 
	.stream()

    book.pipe(res);

});


app.get('/api/:genre/:pages', (req, res) => {

    var genre = req.params.genre;   
    var pages = req.params.pages;
    var url = search + genre;
  console.log("searching for " + genre );

    if(pages == undefined) pages = 1;


     var nbooks = xr( url , '.resultsListContainer li.clearer > ul > li', [{
	img: '.product-image img @src',
	title: '.product-info-title a',
	author: '.contributors a',
	description: xr('.product-info-title a@href', '#truncatedOverview p'),
        pages: xr('.product-info-title a@href', 'div[id=ProductDetailsTab] dl :nth-child(8)'),
        price: xr('.product-info-title a@href', 'p[class=price] span'),
        isbn: xr('.product-info-title a@href' , 'div[id=ProductDetailsTab] dl :nth-child(2)'),
        sales_rank: xr('.product-info-title a@href', 'div[id=ProductDetailsTab] dl :nth-child(10)'),
	rating: 'span[class=gig-rating-stars]@title', 
        book_url: '.product-info-title a@href',
    }]) 
	.paginate('.search-pagination li:last-child a@href')
	.limit(pages)
	.stream()

    nbooks.pipe(res);

});

app.get('/api/genres', (req, res) => {

    var genres = xr('http://www.barnesandnoble.com/h/books/browse', '.links-container.browse.clearer ul li ul li', [{
	subject: 'a',
	url: 'a@href',
    }])
	.stream()

    genres.pipe(res);

});

app.use((req, res, next) => {
  res.status(404).render('error.html');
});


app.listen(process.env.PORT || 3000, function() {
    console.log("listening on 3000");
});
