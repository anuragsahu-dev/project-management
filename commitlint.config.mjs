export default {
    extends: ["@commitlint/config-conventional"],
    rules: {
        "type-enum": [
            2,
            "always",
            [
                "feat", // New feature
                "fix", // Bug fix
                "docs", // Documentation changes
                "style", // Code style (formatting, semicolons, etc)
                "refactor", // Code refactoring
                "perf", // Performance improvements
                "test", // Adding or updating tests
                "build", // Build system or dependencies
                "ci", // CI/CD changes
                "chore", // Maintenance tasks
                "revert", // Reverting changes
            ],
        ],
        "type-case": [2, "always", "lower-case"],
        "subject-case": [2, "never", ["sentence-case", "start-case", "pascal-case", "upper-case"]],
        "subject-empty": [2, "never"],
        "subject-max-length": [2, "always", 72],
        "header-max-length": [2, "always", 100],
    },
};
