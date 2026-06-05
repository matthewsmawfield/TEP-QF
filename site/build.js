#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function readJsonIfExists(filePath) {
    if (!fs.existsSync(filePath)) {
        return null;
    }
    try {
        const raw = fs.readFileSync(filePath, 'utf8');
        try {
            return JSON.parse(raw);
        } catch (error) {
            const sanitized = raw
                .replace(/:\s*-Infinity\b/g, ': null')
                .replace(/:\s*Infinity\b/g, ': null')
                .replace(/:\s*NaN\b/g, ': null');
            return JSON.parse(sanitized);
        }
    } catch (error) {
        console.warn(`⚠️  Failed to parse JSON: ${filePath}`);
        return null;
    }
}

function formatFixedNumber(value, decimals) {
    if (value === null || value === undefined) {
        return '';
    }
    const num = Number(value);
    if (!Number.isFinite(num)) {
        return '';
    }
    return num.toFixed(decimals);
}

function formatSignedNumber(value, decimals) {
    const fixed = formatFixedNumber(value, decimals);
    if (!fixed) {
        return '';
    }
    const num = Number(value);
    return `${num >= 0 ? '+' : ''}${fixed}`;
}

function formatCI(lower, upper, decimals) {
    const lo = formatSignedNumber(lower, decimals);
    const hi = formatSignedNumber(upper, decimals);
    if (!lo || !hi) {
        return '';
    }
    return `[${lo}, ${hi}]`;
}

function formatIntegerWithCommas(value) {
    if (value === null || value === undefined) {
        return '';
    }
    const num = Number(value);
    if (!Number.isFinite(num)) {
        return '';
    }
    return Math.round(num).toLocaleString('en-US');
}

function formatIntegerLatex(value) {
    const s = formatIntegerWithCommas(value);
    if (!s) {
        return '';
    }
    return s.replace(/,/g, '{,}');
}

function formatPValueMantissaExp(pValue, mantissaDecimals = 1) {
    if (pValue === null || pValue === undefined) {
        return null;
    }
    const p = Number(pValue);
    if (!Number.isFinite(p) || p <= 0) {
        return null;
    }
    const exp = Math.floor(Math.log10(p));
    let mantissa = p / Math.pow(10, exp);
    let mantissaStr = mantissa.toFixed(mantissaDecimals);
    if (Number(mantissaStr) >= 10) {
        mantissa = mantissa / 10;
        mantissaStr = mantissa.toFixed(mantissaDecimals);
        return { mantissa: mantissaStr, exp: exp + 1 };
    }
    return { mantissa: mantissaStr, exp };
}

function formatPValueLatex(pValue, mantissaDecimals = 1) {
    const parts = formatPValueMantissaExp(pValue, mantissaDecimals);
    if (!parts) {
        return null;
    }
    return `${parts.mantissa} \\times 10^{${parts.exp}}`;
}

function formatPValueCell(pValue, options = {}) {
    const { includePrefix = false } = options;
    if (pValue === null || pValue === undefined) {
        return '';
    }
    const p = Number(pValue);
    if (!Number.isFinite(p)) {
        return '';
    }
    if (p >= 0.001) {
        const s = formatFixedNumber(p, 3);
        return includePrefix ? `p = ${s}` : s;
    }
    const latex = formatPValueLatex(p);
    if (!latex) {
        return '';
    }
    return includePrefix ? `p = ${latex}` : latex;
}

function formatPValueHtmlCell(pValue) {
    if (pValue === null || pValue === undefined) {
        return '';
    }
    const p = Number(pValue);
    if (!Number.isFinite(p) || p <= 0) {
        return '';
    }
    if (p >= 0.001) {
        return formatFixedNumber(p, 3);
    }
    const latex = formatPValueLatex(p);
    if (!latex) {
        return '';
    }
    return `$${latex}$`;
}

function safeGet(obj, pathParts) {
    let cur = obj;
    for (const part of pathParts) {
        if (cur === null || cur === undefined) {
            return undefined;
        }
        cur = cur[part];
    }
    return cur;
}

function createInjectionContext() {
    const outputsDir = path.join(__dirname, '..', 'results', 'outputs');

    const step102 = readJsonIfExists(path.join(outputsDir, 'step_081_survey_cross_correlation.json'));
    const step109 = readJsonIfExists(path.join(outputsDir, 'step_085_time_lens_map.json'));
    const step114 = readJsonIfExists(path.join(outputsDir, 'step_093_teff_threshold_holdout.json'));

    if (!step102) {
        console.warn('⚠️  Missing step_081_survey_cross_correlation.json; placeholders may remain unresolved.');
    }
    if (!step109) {
        console.warn('⚠️  Missing step_085_time_lens_map.json; placeholders may remain unresolved.');
    }
    if (!step114) {
        console.warn('⚠️  Missing step_093_teff_threshold_holdout.json; placeholders may remain unresolved.');
    }

    const ctx = {
        tep: {
            table12: {},
            table12c: {},
            table12d: {},
            meta: {}
        }
    };

    if (step102) {
        const surveys = ['UNCOVER', 'CEERS', 'COSMOS-Web'];
        for (const survey of surveys) {
            const key = survey.toLowerCase().replace(/[^a-z0-9]+/g, '_');
            const s = step102.survey_correlations?.[survey];
            if (s) {
                ctx.tep.table12[key] = {
                    n: formatIntegerWithCommas(s.n),
                    rho: formatSignedNumber(s.rho, 3),
                    ci: formatCI(s.ci_lower, s.ci_upper, 3),
                    p: formatPValueLatex(s.p)
                };
            }

            const tt = step102.time_tests?.[survey]?.dust_positive_only;
            if (tt) {
                ctx.tep.table12c[key] = {
                    delta_rho: formatSignedNumber(tt.delta_rho, 3),
                    dust_ratio: `${formatFixedNumber(tt.threshold_test?.ratio, 2)}×`,
                    p_threshold: formatPValueLatex(tt.threshold_test?.p_value)
                };
            }
        }

        const meta = step102.meta_analysis;
        const hetero = step102.heterogeneity;
        if (meta) {
            ctx.tep.meta = {
                n_total: formatIntegerWithCommas(meta.n_total),
                n_total_latex: formatIntegerLatex(meta.n_total),
                rho: formatFixedNumber(meta.rho_combined, 3),
                rho_signed: formatSignedNumber(meta.rho_combined, 3),
                ci: formatCI(meta.ci_lower, meta.ci_upper, 3),
                p: formatPValueLatex(meta.p_combined),
                Q: hetero ? formatFixedNumber(hetero.Q, 2) : '',
                p_Q: hetero ? formatFixedNumber(hetero.p_Q, 3) : '',
                I2_percent: hetero ? `${formatFixedNumber(hetero.I2, 1)}\\%` : ''
            };
        }
    }

    if (step109) {
        const surveys = ['UNCOVER', 'CEERS', 'COSMOS-Web'];
        for (const survey of surveys) {
            const key = survey.toLowerCase().replace(/[^a-z0-9]+/g, '_');
            const s = step109.per_survey?.[survey]?.dust_positive_only;
            if (!s) {
                continue;
            }
            const zObs = s.correlations?.dust_vs_z_obs;
            const zEff = s.correlations?.dust_vs_z_eff;
            ctx.tep.table12d[key] = {
                n: formatIntegerWithCommas(s.n),
                rho_z_obs: formatSignedNumber(zObs?.rho, 3),
                p_z_obs: formatPValueHtmlCell(zObs?.p_value),
                rho_z_eff: formatSignedNumber(zEff?.rho, 3),
                p_z_eff: formatPValueHtmlCell(zEff?.p_value)
            };
        }
    }

    if (step114) {
        const summary = step114.summary;
        if (summary) {
            ctx.tep.step114 = {
                selected_threshold_median_gyr: formatFixedNumber(summary.selected_threshold_median_gyr, 2),
                selected_threshold_min_gyr: formatFixedNumber(summary.selected_threshold_min_gyr, 2),
                selected_threshold_max_gyr: formatFixedNumber(summary.selected_threshold_max_gyr, 2),
                fixed_threshold_gyr: formatFixedNumber(summary.fixed_threshold_gyr, 2),
                heldout_p_combined: formatPValueLatex(summary.heldout_p_fisher_fisher_combined?.p),
                fixed_p_combined: formatPValueLatex(summary.fixed_p_fisher_fisher_combined?.p)
            };
        }
    }

    return ctx;
}

function injectPlaceholders(template, context) {
    const unresolved = new Set();
    const replaced = template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (match, expr) => {
        const pathParts = expr.split('.').map(s => s.trim()).filter(Boolean);
        const value = safeGet(context, pathParts);
        if (value === undefined || value === null) {
            unresolved.add(expr);
            return match;
        }
        return String(value);
    });
    if (unresolved.size > 0) {
        console.warn(`⚠️  Unresolved placeholders (${unresolved.size}): ${Array.from(unresolved).slice(0, 10).join(', ')}${unresolved.size > 10 ? ', ...' : ''}`);
    }
    return replaced;
}

async function buildStaticSite() {
    console.log('🔨 Building static site...');
    
    try {
        // Clean dist directory
        const distDir = path.join(__dirname, 'dist');
        if (fs.existsSync(distDir)) {
            console.log('🧹 Cleaning dist directory...');
            fs.rmSync(distDir, { recursive: true, force: true });
        }
        
        // Read the manifest
        const manifestPath = path.join(__dirname, 'manifest.json');
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        
        // Read the base index.html
        const indexPath = path.join(__dirname, 'index.html');
        let indexContent = fs.readFileSync(indexPath, 'utf8');
        
        const injectionContext = createInjectionContext();

        // Build the component content
        let componentsHtml = '';
        
        // Sort sections by order and load each component
        const sortedSections = manifest.sections.sort((a, b) => a.order - b.order);
        
        for (const section of sortedSections) {
            console.log(`📄 Loading section: ${section.title}`);
            
            const componentPath = path.join(__dirname, 'components', section.file);
            
            if (fs.existsSync(componentPath)) {
                const componentHtmlRaw = fs.readFileSync(componentPath, 'utf8');
                const componentHtml = injectPlaceholders(componentHtmlRaw, injectionContext);
                
                // Wrap component in section container (matching the dynamic loader)
                componentsHtml += `
                <section id="${section.id}" class="manuscript-section" data-section="${section.title}">
                    ${componentHtml}
                </section>`;
            } else {
                console.warn(`⚠️  Component not found: ${section.file}`);
                componentsHtml += `
                <section id="${section.id}" class="manuscript-section" data-section="${section.title}">
                    <div style="background-color: #ffe6e6; border: 1px solid #ff9999; padding: 15px; margin: 20px 0; border-radius: 5px;">
                        <h3 style="color: #cc0000; margin-top: 0;">Missing Section: ${section.title}</h3>
                        <p>Component file <code>components/${section.file}</code> not found</p>
                    </div>
                </section>`;
            }
        }
        
        // Replace the dynamic content with static content
        const staticContent = indexContent
            .replace(
                /<div id="loading".*?<\/div>\s*<div id="manuscript-content".*?<\/div>/s,
                () => `<div id="manuscript-content">${componentsHtml}</div>`
            )
            .replace(/<div id="loading"[^>]*>[\s\S]*?<\/div>/g, '')
            .replace(/<div id="manuscript-content"[^>]*style="display:\s*none;"[^>]*>[\s\S]*?<\/div>/g, '')
            .replace(
                /<!-- Component Loading Script -->[\s\S]*?<\/script>/g,
                `<!-- Static build - components pre-loaded -->\n    <script>\n        document.addEventListener("DOMContentLoaded", function() {\n            if (window.MathJax && window.MathJax.typesetPromise) {\n                window.MathJax.typesetPromise().catch(function (err) {\n                    console.error("MathJax error:", err.message);\n                });\n            }\n        });\n    </script>`
            )
            .replace(
                '<main id="main-content" role="main">',
                '<!-- This is a statically built version for SEO/deployment -->\n    <main id="main-content" role="main">'
            );
        
        // Create dist directory if it doesn't exist
        if (!fs.existsSync(distDir)) {
            fs.mkdirSync(distDir, { recursive: true });
        }
        
        // Write the built file
        const outputPath = path.join(distDir, 'index.html');
        fs.writeFileSync(outputPath, staticContent, 'utf8');
        
        // Copy necessary static assets to dist
        // EXPLICITLY COPY STYLES DIRECTORY
        const assetDirs = ['public', 'figures', 'data', 'styles'];
        for (const assetDir of assetDirs) {
            const srcPath = path.join(__dirname, assetDir);
            const destPath = path.join(distDir, assetDir);
            
            if (fs.existsSync(srcPath)) {
                console.log(`📁 Copying ${assetDir}/`);
                copyRecursiveSync(srcPath, destPath);
            }
        }

        // Copy simple-styles.css if it exists
        const simpleStylesSrc = path.join(__dirname, 'simple-styles.css');
        const simpleStylesDest = path.join(distDir, 'simple-styles.css');
        if (fs.existsSync(simpleStylesSrc)) {
            fs.copyFileSync(simpleStylesSrc, simpleStylesDest);
            console.log('📁 Copied simple-styles.css');
        }
        
        // Copy figures from results/figures/ to dist/figures/ (main figure source)
        const resultsFiguresPath = path.join(__dirname, '..', 'results', 'figures');
        const distFiguresPath = path.join(distDir, 'figures');
        const distPublicFiguresPath = path.join(distDir, 'public', 'figures');
        if (fs.existsSync(resultsFiguresPath)) {
            console.log('📁 Copying results/figures/ → dist/figures/');
            copyRecursiveSync(resultsFiguresPath, distFiguresPath);
            console.log('📁 Copying results/figures/ → dist/public/figures/');
            copyRecursiveSync(resultsFiguresPath, distPublicFiguresPath);
        }
        
        // Copy manifest.json for reference
        fs.copyFileSync(manifestPath, path.join(distDir, 'manifest.json'));
        
        // Copy .nojekyll to dist root for GitHub Pages
        const nojekyllSrc = path.join(__dirname, 'public', '.nojekyll');
        const nojekyllDest = path.join(distDir, '.nojekyll');
        if (fs.existsSync(nojekyllSrc)) {
            fs.copyFileSync(nojekyllSrc, nojekyllDest);
            console.log('📁 Copied .nojekyll to dist root');
        } else {
            // Create it if it doesn't exist
            fs.writeFileSync(nojekyllDest, '');
            console.log('📁 Created .nojekyll in dist root');
        }

        // Copy robots.txt and sitemap.xml to dist root
        const rootFiles = ['404.html', 'robots.txt', 'sitemap.xml', 'CNAME', '29c6507763d2303d801cc8ed89d39f88.txt', 'favicon.ico'];
        for (const file of rootFiles) {
            const src = path.join(__dirname, 'public', file);
            const dest = path.join(distDir, file);
            if (fs.existsSync(src)) {
                fs.copyFileSync(src, dest);
                console.log(`📁 Copied ${file} to dist root`);
            }
        }
        
        // Copy citation files to dist root
        const citationFiles = ['CITATION.cff', 'CITATION.bib', 'citation.json', 'codemeta.json', 'README.md'];
        const optionalCitationFiles = new Set(['LICENSE']);
        const projectRoot = path.join(__dirname, '..');
        
        for (const file of [...citationFiles, ...optionalCitationFiles]) {
            const candidates = [
                path.join(projectRoot, file),
                path.join(__dirname, file),
            ];
            const src = candidates.find(candidate => fs.existsSync(candidate));
            const dest = path.join(distDir, file);
            if (src) {
                fs.copyFileSync(src, dest);
                console.log(`📁 Copied ${file} to dist root`);
            } else if (!optionalCitationFiles.has(file)) {
                console.warn(`⚠️  Missing citation file: ${file}`);
            }
        }
        
        // Copy .well-known directory
        const wellKnownSrc = path.join(__dirname, 'public', '.well-known');
        const wellKnownDest = path.join(distDir, '.well-known');
        if (fs.existsSync(wellKnownSrc)) {
            if (!fs.existsSync(wellKnownDest)) {
                fs.mkdirSync(wellKnownDest, { recursive: true });
            }
            const files = fs.readdirSync(wellKnownSrc);
            for (const file of files) {
                fs.copyFileSync(path.join(wellKnownSrc, file), path.join(wellKnownDest, file));
            }
            console.log(`📁 Copied .well-known/ to dist`);
        }
        
        // Generate markdown version
        console.log('📝 Generating markdown version...');
        const { HTMLToMarkdownConverter } = require('./html-to-markdown.js');
        const converter = new HTMLToMarkdownConverter();
        await converter.convertSiteToMarkdown();
        
        console.log('✅ Static site built successfully!');
        console.log(`📁 Output: ${outputPath}`);
        console.log(`📊 Generated ${manifest.sections.length} sections`);
        console.log('🚀 Ready for deployment');
        
    } catch (error) {
        console.error('❌ Build failed:', error);
        process.exit(1);
    }
}

// Helper function to copy directories recursively
function copyRecursiveSync(src, dest) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();
    
    if (isDirectory) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        fs.readdirSync(src).forEach(childItemName => {
            copyRecursiveSync(
                path.join(src, childItemName),
                path.join(dest, childItemName)
            );
        });
    } else {
        // Filter out raw data files
        if (src.endsWith('.csv') || src.endsWith('.dat') || src.endsWith('.nc')) {
            return;
        }
        fs.copyFileSync(src, dest);
    }
}

// Run if called directly
if (require.main === module) {
    buildStaticSite();
}

module.exports = { buildStaticSite };
