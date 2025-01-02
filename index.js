require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const app = express();
const PORT = 5000;

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

app.use(cors());

app.use(express.static(path.join(__dirname, 'src/public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));

app.use(expressLayouts);
app.set('layout', 'layouts/main');



const getAccessToken = async () => {
	try {
		const result = await axios.post(
			'https://accounts.spotify.com/api/token',
			new URLSearchParams({
				grant_type: 'client_credentials'
			}), {
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
			},
			});
		return result.data.access_token;
	} catch(error){
    //on fail, log the error in console
		console.log(error);
	}

};

app.get('/', async(req, res) => {
	res.render('index');
})

// Search artist
app.get('/artists/search', async (req, res) => {
	const artistName = req.query.name;
	const offset = req.query.offset || 0;
	const limit = req.query.limit || 10;

	try {
		const accessToken = await getAccessToken();
		const response = await axios.get(
			`https://api.spotify.com/v1/search`, {
			headers: {
				'Authorization': `Bearer ${accessToken}`,
			},
			params: {
				q: artistName,
				type: 'artist',
				offset,
				limit
			},
		});

		res.render('artists', {
		 	artists: response.data.artists,
		 	query: artistName 
		});

	} catch (error) {
		console.error('Error fetching artist data:', error.response?.data || error.message);
		res.status(500).json({ error: 'Failed to fetch artist data' });
	}
});

// View artist
app.get('/artist/show/:id', async (req, res) => {
	const id = req.params.id;

	try {
		const accessToken = await getAccessToken();

		// Fetching info about the artist
		const artistResponse = await axios.get(
			`https://api.spotify.com/v1/artists`, {
			headers: {
				'Authorization': `Bearer ${accessToken}`,
			},
			params: {
				ids: id,
			},
		});

		// Fetching artist's top tracks
		const topTracks = await axios.get(
			`https://api.spotify.com/v1/artists/${id}/top-tracks`, {
				headers: {
					'Authorization': `Bearer ${accessToken}`
				},
				params: {
					market: 'PH'
				}
			})

		// Fetching artist's albums
		const albums = await axios.get(
			`https://api.spotify.com/v1/artists/${id}/albums`, {
				headers: {
					'Authorization': `Bearer ${accessToken}`
				},

			})


		res.render('show-artist', {
		 	artist: artistResponse.data.artists[0],
		 	topTracks: topTracks.data,
		 	albums: albums.data
		});

	} catch (error) {
		console.error('Error fetching artist data:', error.response?.data || error.message);
		res.status(500).json({ error: 'Failed to fetch artist data' });
	}

});



// Search artist api
app.get('/api/artist/search', async (req, res) => {
	const artistName = req.query.name;
	const offset = req.query.offset || 0;
	const limit = req.query.limit || 20;
	try {
		const accessToken = await getAccessToken();

		const response = await axios.get(
			`https://api.spotify.com/v1/search`, {
			headers: {
				'Authorization': `Bearer ${accessToken}`,
			},
			params: {
				q: artistName,
				type: 'artist',
				offset,
				limit
			},
		});


		res.json(response.data.artists);
		// res.render('artists', { artists: response.data.artists, query: artistName } );

	} catch (error) {
		console.error('Error fetching artist data:', error.response?.data || error.message);
		res.status(500).json({ error: 'Failed to fetch artist data' });
	}
});

app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});
