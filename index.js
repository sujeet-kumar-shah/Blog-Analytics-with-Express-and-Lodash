const express = require("express");
const app = express();
const fetch = require('node-fetch');
const _ = require('lodash');

// Middleware to fetch and analyze blog data
var data = async (req, res, next) => {
  try {
    async function websiteurl() {
      const url = 'https://intent-kit-16.hasura.app/api/rest/blogs';
      const headers = {
        'x-hasura-admin-secret': '32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6',
      };

      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      const responseData = await response.json();
      //catch data of api in responseData variable
      req.apidata = responseData;
    }

    await websiteurl();
    next(); //  when successful API request done then Call next() after the
  } catch (error) {
    console.error('Error-', error);
    next(error); // Call next with the error to pass it to the error handler
  }
}

// Calculate the longest title in a list of blogs
function getLongestTitle(blogData) {
  return _.maxBy(blogData, (blog) => (blog.title || '').length);
}

// Create a middleware to analyze and respond with blog statistics
app.get('/api/blog-stats', data, (req, res) => {
  const blogData = req.apidata;
  if (blogData) {
    const totalblogs = blogData.length;

    // Find the blog with the longest title using memoization
    const longestTitleBlog = memoizedGetLongestTitle(blogData);

    // Find blogs with "Privacy" in the title using memoization
    const blogsWithPrivacy = memoizedFilterBlogsWithPrivacy(blogData);

    // Create an array of unique blog titles using memoization
    const uniqueTitles = memoizedGetUniqueTitles(blogData);

    res.json({
      totalblogs,
      longestTitleBlog,
      blogsWithPrivacy: blogsWithPrivacy.length,
      uniqueTitles
    });
  } else {
    // Handle the case where apidata is not available 
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Create a blog search endpoint
app.get('/api/blog-search', (req, res) => {
  const query = req.query.q; // Get the query parameter from the URL

  if (!query) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  const blogData = req.apidata;

  if (blogData) {
    // Filter blog titles based on the query using memoization
    const matchingTitles = memoizedFilterMatchingTitles(blogData, query);

    res.json({ matchingTitles });
  } else {
    // Handle the case where apidata is not available 
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Memoize functions for caching
const memoizedGetLongestTitle = _.memoize(getLongestTitle, () => 'longest-title-cache', 300000); // Cache results for 5 minutes
const memoizedFilterBlogsWithPrivacy = _.memoize(filterBlogsWithPrivacy, () => 'blog-privacy-cache', 300000); // Cache results for 5 minutes
const memoizedGetUniqueTitles = _.memoize(getUniqueTitles, () => 'unique-titles-cache', 300000); // Cache results for 5 minutes
const memoizedFilterMatchingTitles = _.memoize(filterMatchingTitles, (blogData, query) => `search-cache-${query}`, 300000); // Cache results for 5 minutes

// Helper function to filter blogs with "Privacy" in the title
function filterBlogsWithPrivacy(blogData) {
  return _.filter(blogData, (blog) =>
    _.includes((blog.title || '').toLowerCase(), 'privacy')
  );
}

// Helper function to create an array of unique blog titles
function getUniqueTitles(blogData) {
  return _.uniq(_.map(blogData, 'title'));
}

// Helper function to filter blog titles based on the query
function filterMatchingTitles(blogData, query) {
  return _.filter(blogData, (blog) =>
    (blog.title || '').toLowerCase().includes(query.toLowerCase())
  );
}

app.listen(500);
  