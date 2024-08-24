import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import lit from '@astrojs/lit';

// https://astro.build/config
export default defineConfig({
    site: 'https://www.littlelyon.com',
    integrations: [
        mdx(),
        sitemap(),
        tailwind({
            applyBaseStyles: false
        }),
        react({
            include: ['**/react/*']
        }),
        lit({
            include: ['**/lit/*']
        })
    ]
});
