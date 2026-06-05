#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

class HTMLToMarkdownConverter {
    constructor() { this.output = ''; }

    decodeEntities(text) {
        // Decode decimal numeric entities
        text = text.replace(/&#(\d+);/g, (match, dec) => String.fromCodePoint(dec));
        // Decode hexadecimal numeric entities
        text = text.replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => String.fromCodePoint(parseInt(hex, 16)));

        const entities = {
            amp: '&', lt: '<', gt: '>', nbsp: ' ',
            mdash: '—', ndash: '–',
            hellip: '…', ldquo: '"', rdquo: '"',
            lsquo: '\'', rsquo: '\'',
            copy: '©', reg: '®', trade: '™',
            deg: '°', prime: '′', Prime: '″',
            frac12: '½', frac14: '¼', frac34: '¾',
            sup2: '²', sup3: '³', sup1: '¹',
            plusmn: '±', pm: '±', minus: '−',
            times: '×', middot: '·', bull: '•',
            prop: '∝', approx: '≈', asymp: '≈',
            le: '≤', ge: '≥', ne: '≠',
            ll: '≪', rarr: '→', larr: '←', harr: '↔',
            rArr: '⇒', lArr: '⇐',
            ouml: 'ö', uuml: 'ü', auml: 'ä',
            infin: '∞', isin: '∈', notin: '∉',
            Zopf: 'ℤ', real: 'ℝ', complex: 'ℂ',
            forall: '∀', exist: '∃',
            sect: '§', para: '¶', dagger: '†', Dagger: '‡',
            alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ',
            epsilon: 'ε', zeta: 'ζ', eta: 'η', theta: 'θ',
            iota: 'ι', kappa: 'κ', lambda: 'λ', mu: 'μ',
            nu: 'ν', xi: 'ξ', omicron: 'ο', pi: 'π',
            rho: 'ρ', sigmaf: 'ς', sigma: 'σ', tau: 'τ',
            upsilon: 'υ', phi: 'φ', chi: 'χ', psi: 'ψ',
            omega: 'ω',
            Alpha: 'Α', Beta: 'Β', Gamma: 'Γ', Delta: 'Δ',
            Epsilon: 'Ε', Zeta: 'Ζ', Eta: 'Η', Theta: 'Θ',
            Iota: 'Ι', Kappa: 'Κ', Lambda: 'Λ', Mu: 'Μ',
            Nu: 'Ν', Xi: 'Ξ', Omicron: 'Ο', Pi: 'Π',
            Rho: 'Ρ', Sigma: 'Σ', Tau: 'Τ', Upsilon: 'Υ',
            Phi: 'Φ', Chi: 'Χ', Psi: 'Ψ', Omega: 'Ω',
            nabla: '∇', part: '∂', int: '∫', oint: '∮',
            radic: '√', square: '□', hbar: 'ℏ', ell: 'ℓ',
            perp: '⊥', cdot: '·', star: '⋆'
        };

        text = text.replace(/&([a-zA-Z][a-zA-Z0-9]*);/g, (match, name) => {
            return entities[name] !== undefined ? entities[name] : match;
        });

        return text;
    }

    cleanInlineHtml(html) {
        let result = html;
        // Handle sup/sub with content first (capture the raw content including entities)
        result = result.replace(/<sup[^>]*>([\s\S]*?)<\/sup>/gi, (match, content) => {
            return '^{' + this.decodeEntities(content) + '}';
        });
        result = result.replace(/<sub[^>]*>([\s\S]*?)<\/sub>/gi, (match, content) => {
            return '_{' + this.decodeEntities(content) + '}';
        });
        // Decode remaining entities
        result = this.decodeEntities(result);
        // Handle other formatting
        result = result
            .replace(/<(strong|b)[^>]*>([\s\S]*?)<\/(strong|b)>/gi, '**$2**')
            .replace(/<(em|i)[^>]*>([\s\S]*?)<\/(em|i)>/gi, '*$2*')
            .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`')
            .replace(/<br\s*\/?>/gi, ' ')
            .replace(/<\/?[a-zA-Z][^>]*>/g, '');
        return result.replace(/\s+/g, ' ').trim();
    }

    tableToMarkdown(tableHtml) {
        const captionMatch = tableHtml.match(/<caption[^>]*>([\s\S]*?)<\/caption>/i);
        const caption = captionMatch ? this.cleanInlineHtml(captionMatch[1]) : '';
        const rows = [];
        const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
        let rowMatch;

        while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
            const cells = [];
            const cellRegex = /<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi;
            let cellMatch;

            while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) {
                cells.push(this.cleanInlineHtml(cellMatch[1]).replace(/\|/g, '\\|'));
            }

            if (cells.length) rows.push(cells);
        }

        if (!rows.length) return '';

        const header = rows[0];
        const normalizeRow = (row) => `| ${header.map((_, index) => row[index] || '').join(' | ')} |`;

        let markdown = '';
        if (caption) markdown += `\n\n${caption}\n\n`;
        markdown += `${normalizeRow(header)}\n`;
        markdown += `| ${header.map(() => '---').join(' | ')} |\n`;
        for (const row of rows.slice(1)) markdown += `${normalizeRow(row)}\n`;
        return `\n\n${markdown}\n`;
    }

    htmlToMarkdown(html) {
        html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gis, '');
        html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gis, '');
        html = html.replace(/<!--[\s\S]*?-->/g, '');
        html = html.replace(/<nav\b[\s\S]*?<\/nav>/gi, '');
        html = html.replace(/<div[^>]*class=["']manuscript-section[^"']*["'][^>]*data-section=["']([^"']*)["'][^>]*>/gi, '\n\n## $1\n\n');

        html = html.replace(/<pre[^>]*>\s*<code(?: class=["']language-([^"']+)["'])?[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/gi, (match, lang, code) => {
            const language = (lang || '').trim();
            const decodedCode = this.decodeEntities(code).replace(/\n+$/g, '');
            return `\n\n@@@CODEBLOCK_START:${language}@@@\n${decodedCode}\n@@@CODEBLOCK_END@@@\n\n`;
        });

        html = html.replace(/<table[^>]*>[\s\S]*?<\/table>/gi, (match) => this.tableToMarkdown(match));

        html = html.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n# $1\n\n');
        html = html.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n## $1\n\n');
        html = html.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n### $1\n\n');
        html = html.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '\n#### $1\n\n');
        html = html.replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, '\n##### $1\n\n');
        html = html.replace(/<h6[^>]*>([\s\S]*?)<\/h6>/gi, '\n###### $1\n\n');

        html = html.replace(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/gi, '\n\n    $1\n');
        html = html.replace(/<figure[^>]*>([\s\S]*?)<\/figure>/gi, '\n\n$1\n\n');

        html = html.replace(/<img[^>]+>/gi, (tag) => {
            const srcMatch = tag.match(/src=["']([^"']+)["']/i);
            const altMatch = tag.match(/alt=["']([^"']*)["']/i);
            const src = srcMatch ? srcMatch[1] : '';
            const alt = altMatch ? altMatch[1] : '';
            return src ? `\n![${alt}](${src})\n` : '';
        });

        html = html.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (match, content) => '\n> ' + this.cleanInlineHtml(content) + '\n\n');
        html = html.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (match, content) => this.cleanInlineHtml(content) + '\n\n');

        html = html.replace(/<(strong|b)[^>]*>([\s\S]*?)<\/(strong|b)>/gi, '**$2**');
        html = html.replace(/<(em|i)[^>]*>([\s\S]*?)<\/(em|i)>/gi, '*$2*');
        html = html.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`');

        html = html.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (match, content) => '- ' + this.cleanInlineHtml(content) + '\n');
        html = html.replace(/<br\s*\/?>/gi, '\n');
        html = html.replace(/<hr\s*\/?>/gi, '\n---\n');

        html = html.replace(/<\/?[a-zA-Z][^>]*>/g, '');
        html = this.decodeEntities(html);
        html = html.replace(/@@@CODEBLOCK_START:([^@]*)@@@[\r\n]+([\s\S]*?)[\r\n]+@@@CODEBLOCK_END@@@/g, (match, lang, code) => {
            const language = lang.trim();
            return `\n\n\`\`\`${language}\n${code}\n\`\`\`\n\n`;
        });

        return html.replace(/\n{3,}/g, '\n\n').trim();
    }

    async convertSiteToMarkdown() {
        console.log('🔄 Converting HTML site to markdown (TEP-QF)...');
        try {
            const manifestPath = path.join(__dirname, 'manifest.json');
            if (!fs.existsSync(manifestPath)) throw new Error('manifest.json not found.');
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            const sections = manifest.sections.sort((a, b) => a.order - b.order);

            let allHtml = '';
            for (const section of sections) {
                const componentPath = path.join(__dirname, 'components', section.file);
                if (fs.existsSync(componentPath)) {
                    const html = fs.readFileSync(componentPath, 'utf8');
                    allHtml += `\n<!-- SECTION: ${section.title} -->\n${html}\n`;
                    console.log(`  ✓ ${section.file} (${(html.length / 1024).toFixed(1)} KB)`);
                } else {
                    console.warn(`  ⚠ Missing: ${section.file}`);
                }
            }

            console.log(`  Total HTML: ${(allHtml.length / 1024).toFixed(1)} KB`);
            const markdownTitle = manifest.title || 'Temporal Equivalence Principle: The Dirac Limit of Dynamical Proper Time';
            const author = manifest.author || 'Matthew Lukin Smawfield';
            const version = manifest.version || 'v0.1';
            const codename = manifest.codename || 'TBD';
            const firstPublished = manifest.first_published || manifest.date || new Date().getFullYear();
            const lastUpdated = manifest.last_updated || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
            const doi = manifest.doi || 'pending';
            
            const header = `# ${markdownTitle}\n**${author}**\nVersion: ${version} (${codename})\nFirst published: ${firstPublished} · Last updated: ${lastUpdated}\nDOI: ${doi}\n\n---\n\n`;
            
            let markdown = this.htmlToMarkdown(allHtml);
            // Remove leading indentation from all lines
            markdown = markdown.split('\n').map(line => line.replace(/^\s+/, '')).join('\n').trim();
            
            const fullMarkdown = header + markdown;
            const outputPath = path.join(__dirname, '..', `23-TEP-QF-${version}-${codename}.md`);
            fs.writeFileSync(outputPath, fullMarkdown, 'utf8');
            console.log(`✅ Markdown saved to: ${outputPath} (${(markdown.length / 1024).toFixed(1)} KB)`);
        } catch (error) {
            console.error('❌ Markdown conversion failed:', error.message);
        }
    }
}

if (require.main === module) {
    const c = new HTMLToMarkdownConverter();
    c.convertSiteToMarkdown();
}
module.exports = { HTMLToMarkdownConverter };
