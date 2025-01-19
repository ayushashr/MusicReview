import { getAccessToken, searchSpotify, fetchAlbumCoverArt } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
    const songNameInput = document.getElementById('songName');
    const searchResults = document.getElementById('searchResults');
    const reviewForm = document.getElementById('reviewForm');
    const stars = document.querySelectorAll('.star');
    let selectedRating = 0;

    // Load Spotify access token on page load
    await getAccessToken();

    // Trigger search when typing
    songNameInput?.addEventListener('input', async (e) => {
        const query = e.target.value;
        const data = await searchSpotify(query);
        if (data) displaySearchResults(data);
    });

    // Display search results
    function displaySearchResults(data) {
        if (!searchResults) return;

        searchResults.innerHTML = '';
        const results = [];

        if (data.tracks?.items.length) {
            results.push('<h4>Tracks</h4>');
            data.tracks.items.forEach((track) => {
                const imageUrl = track.album.images[0]?.url || 'placeholder.jpg';
                results.push(`
                    <div class="result-item" onclick="selectResult('${track.name}')">
                        <img src="${imageUrl}" alt="${track.name}">
                        <div>
                            <strong>${track.name}</strong><br>
                            ${track.artists.map((artist) => artist.name).join(', ')}
                        </div>
                    </div>
                `);
            });
        }

        if (data.albums?.items.length) {
            results.push('<h4>Albums</h4>');
            data.albums.items.forEach((album) => {
                const imageUrl = album.images[0]?.url || 'placeholder.jpg';
                results.push(`
                    <div class="result-item" onclick="selectResult('${album.name}')">
                        <img src="${imageUrl}" alt="${album.name}">
                        <div>
                            <strong>${album.name}</strong><br>
                            ${album.artists.map((artist) => artist.name).join(', ')}
                        </div>
                    </div>
                `);
            });
        }

        searchResults.innerHTML = results.length ? results.join('') : '<p>No results found</p>';
    }

    // Allow result selection
    window.selectResult = (name) => {
        if (songNameInput) {
            songNameInput.value = name;
            if (searchResults) searchResults.innerHTML = '';
        }
    };

    // Handle star rating
    stars.forEach((star) => {
        star.addEventListener('click', () => {
            selectedRating = parseInt(star.getAttribute('data-value'), 10);
            stars.forEach((s) => {
                const value = parseInt(s.getAttribute('data-value'), 10);
                s.classList.toggle('selected', value <= selectedRating);
            });
        });

        star.addEventListener('mouseover', () => {
            const hoverValue = parseInt(star.getAttribute('data-value'), 10);
            stars.forEach((s) => {
                const value = parseInt(s.getAttribute('data-value'), 10);
                s.classList.toggle('hovered', value <= hoverValue);
            });
        });

        star.addEventListener('mouseout', () => {
            stars.forEach((s) => s.classList.remove('hovered'));
        });
    });

    // Form submission
    reviewForm?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const songName = songNameInput.value.trim();
        const userReview = document.getElementById('userReview').value.trim();

        if (!songName || !userReview || selectedRating === 0) {
            alert('Please fill in all fields and select a rating.');
            return;
        }

        const newReview = { songName, userReview, rating: selectedRating };
        const reviews = JSON.parse(localStorage.getItem('reviews')) || [];
        reviews.push(newReview);
        localStorage.setItem('reviews', JSON.stringify(reviews));

        reviewForm.reset();
        stars.forEach((s) => s.classList.remove('selected'));
        selectedRating = 0;

        // Redirect to review page
        window.location.href = 'reviewPage.html';
    });

    // Load and display reviews
    const reviewList = document.querySelector('.reviews');
    if (reviewList) {
        const reviews = JSON.parse(localStorage.getItem('reviews')) || [];

        reviews.forEach(async (review) => {
            const coverUrl = await fetchAlbumCoverArt(review.songName);
            const reviewItem = document.createElement('li');
            reviewItem.classList.add('review-item');
            reviewItem.innerHTML = `
                <div class="review-content">
                    <img src="${coverUrl}" alt="${review.songName} cover" class="album-cover">
                    <div>
                        <strong>${review.songName}</strong> (${review.rating}★)
                        <p>${review.userReview}</p>
                    </div>
                </div>
            `;
            reviewList.appendChild(reviewItem);
        });

        if (reviews.length === 0) {
            reviewList.innerHTML = '<p>No reviews available. Add one from the "Add Review" page!</p>';
        }
    }
});
