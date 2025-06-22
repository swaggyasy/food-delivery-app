# Tanjong Frozen E-Commerce & Delivery

This is a comprehensive e-commerce platform for a frozen goods business, featuring a customer-facing storefront, an admin dashboard for management, and real-time order tracking with driver location updates.

## ✅ Features

### Customer-Facing
- **Product Catalog**: Browse and search for products.
- **Shopping Cart**: Add/remove items, adjust quantities.
- **Checkout**: Secure checkout with location picker using Google Maps.
- **Order Tracking**: Real-time order status and driver location on a map.
- **User Profile**: Manage personal information and view order history.

### Admin Dashboard
- **Order Management**: View, update, and manage all orders.
- **Product Management**: Add, edit, and remove products.
- **User Management**: View and manage customer accounts.
- **Announcements**: Post updates for customers.

### Technical
- **React Frontend**: Modern, responsive UI built with React.
- **Firebase Backend**: Firestore for database, Authentication for user management.
- **Google Maps Integration**: For address selection, and location tracking.
- **Real-time Updates**: WebSockets for live order and location updates.

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or later)
- npm
- A Google Maps API key with **Maps JavaScript API**, **Places API**, and **Geocoding API** enabled.

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd tanjong-frozen
    ```

2.  **Install dependencies for the frontend:**
    ```bash
    cd testing1/testing
    npm install
    ```

3.  **Configure Firebase:**
    - Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com/).
    - Set up Firestore and Authentication.
    - Get your Firebase configuration object and place it in `testing1/testing/src/firebase/config.js`.

4.  **Configure Google Maps API Key:**
    - The application now uses a centralized `GoogleMapsProvider` to load the Google Maps API.
    - The API key is managed in `testing1/testing/src/context/GoogleMapsContext.js`.
    - It's recommended to use environment variables for your API key. You can create a `.env` file in the `testing1/testing` directory:
      ```
      REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
      ```

5.  **Start the React development server:**
    ```bash
    npm start
    ```
    The application will be available at `http://localhost:3000`.

## 🗺️ Google Maps API Setup

The Google Maps integration is crucial for this application. The API is now loaded once using a `GoogleMapsProvider` to improve performance and prevent errors.

- **Libraries Used**: `maps`, `places`
- **Configuration**: `testing1/testing/src/context/GoogleMapsContext.js`

Make sure your API key has the following APIs enabled in your Google Cloud Platform console:
-   **Maps JavaScript API**: To display maps.
-   **Places API**: For the address autocomplete feature in the checkout.
-   **Geocoding API**: To convert addresses to coordinates and vice-versa.

Ensure your API key is not restricted in a way that would block `localhost` during development.

## ⚙️ Project Structure

-   `testing1/testing/public`: Public assets and `index.html`.
-   `testing1/testing/src/`: Main source code for the React application.
    -   `components`: Reusable React components.
    -   `pages`: Top-level page components.
    -   `context`: React context providers (e.g., `CartContext`, `GoogleMapsContext`).
    -   `firebase`: Firebase configuration.
    -   `services`: Modules for interacting with APIs and backend services.
    -   `styles`: CSS files for styling.
-   `functions`: Firebase Cloud Functions (if any).
-   `server`: Backend server code (if any).

---

*This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).*

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
