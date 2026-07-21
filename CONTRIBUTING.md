# Contributing to Sneyk

Thank you for your interest in contributing to Sneyk! Here is a quick guide on how to get started:

## Development Setup

1. Fork the repository on GitHub.
2. Clone your fork locally.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## Creating a Pull Request

1. Create a new branch for your feature or bug fix:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Make your changes and ensure they adhere to the project's code style.
3. Run linting and tests to ensure no regressions:
   ```bash
   npm run lint
   npm run test
   ```
4. Commit your changes with a clear and descriptive commit message.
5. Push to your fork and submit a Pull Request to the `main` branch.

## Code Style

- Code formatting is handled by Prettier. You can run formatting with:
  ```bash
  npm run format
  ```
- Strict TypeScript is enforced. Please avoid using `any`.
- Keep modules modular, clean, and well-tested.
