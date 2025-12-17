# GitHub Actions Workflows

This directory contains GitHub Actions workflows for CI/CD.

## Workflows

### 1. `build.yml` - Build and Test
**Triggers:** Push/PR to `main` or `develop`

**Jobs:**
- **Backend:** Build Go server, run tests, upload coverage
- **Frontend:** Validate HTML/JS/CSS, create artifacts
- **Lint:** Run golangci-lint on Go code
- **Security:** Run Trivy vulnerability scanner

**Usage:**
```bash
# Automatically runs on push/PR
git push origin main
```

### 2. `deploy.yml` - Deploy to Production
**Triggers:** Push to `main` or version tags

**Jobs:**
- Build optimized backend binary
- Create deployment package
- Upload artifacts
- Deploy to server (optional, requires secrets)

**Required Secrets:**
- `DEPLOY_HOST` - Server hostname/IP
- `DEPLOY_USER` - SSH username
- `DEPLOY_KEY` - SSH private key

**Usage:**
```bash
# Deploy on push to main
git push origin main

# Or create a tag
git tag v1.0.0
git push origin v1.0.0
```

### 3. `release.yml` - Create Release
**Triggers:** Version tags (`v*.*.*`)

**Jobs:**
- Build for multiple platforms (Linux, Windows, macOS)
- Create release packages (.tar.gz, .zip)
- Generate changelog
- Create GitHub release with artifacts

**Platforms:**
- Linux (amd64)
- Windows (amd64)
- macOS Intel (amd64)
- macOS Apple Silicon (arm64)

**Usage:**
```bash
# Create and push a version tag
git tag v1.0.0
git push origin v1.0.0

# Release will be created automatically
```

## Setup

### 1. Enable GitHub Actions
1. Go to repository Settings
2. Navigate to Actions > General
3. Enable "Allow all actions and reusable workflows"

### 2. Add Secrets (for deployment)
1. Go to Settings > Secrets and variables > Actions
2. Add the following secrets:
   - `DEPLOY_HOST` - Your server hostname
   - `DEPLOY_USER` - SSH username
   - `DEPLOY_KEY` - SSH private key

### 3. Configure Codecov (optional)
1. Sign up at https://codecov.io
2. Add repository
3. No token needed for public repos

## Workflow Status Badges

Add to your README.md:

```markdown
![Build](https://github.com/YOUR_USERNAME/YOUR_REPO/workflows/Build%20and%20Test/badge.svg)
![Deploy](https://github.com/YOUR_USERNAME/YOUR_REPO/workflows/Deploy%20to%20Production/badge.svg)
```

## Local Testing

Test workflows locally using [act](https://github.com/nektos/act):

```bash
# Install act
brew install act  # macOS
# or
choco install act  # Windows

# Run build workflow
act -j backend

# Run all workflows
act push
```

## Customization

### Change Go Version
Edit `go-version` in workflows:
```yaml
- name: Set up Go
  uses: actions/setup-go@v4
  with:
    go-version: '1.22'  # Change here
```

### Add More Tests
Add steps to `build.yml`:
```yaml
- name: Run integration tests
  working-directory: ./backend
  run: go test -v -tags=integration ./...
```

### Change Deployment Target
Edit `deploy.yml` script section:
```yaml
script: |
  cd /your/custom/path
  ./your-deploy-script.sh
```

## Troubleshooting

### Build Fails
- Check Go version compatibility
- Verify all dependencies in go.mod
- Check for syntax errors

### Deployment Fails
- Verify SSH secrets are correct
- Check server accessibility
- Verify deployment path exists

### Release Fails
- Ensure tag follows `v*.*.*` format
- Check build permissions
- Verify GITHUB_TOKEN has write access

## Best Practices

1. **Always test locally** before pushing
2. **Use semantic versioning** for releases (v1.0.0)
3. **Keep secrets secure** - never commit them
4. **Monitor workflow runs** in Actions tab
5. **Review security alerts** from Trivy scanner

## Support

For issues with workflows:
1. Check workflow logs in Actions tab
2. Review GitHub Actions documentation
3. Check individual action repositories
