export type Image = {
    src: string;
    alt?: string;
    caption?: string;
};

export type Link = {
    text: string;
    href: string;
};

export type Hero = {
    title?: string;
    text?: string;
    image?: Image;
    actions?: Link[];
};

export type Subscribe = {
    title?: string;
    text?: string;
    formUrl: string;
};

export type SiteConfig = {
    logo?: Image;
    title: string;
    subtitle?: string;
    description: string;
    image?: Image;
    headerNavLinks?: Link[];
    footerNavLinks?: Link[];
    socialLinks?: Link[];
    hero?: Hero;
    subscribe?: Subscribe;
    postsPerPage?: number;
    projectsPerPage?: number;
};

const siteConfig: SiteConfig = {
    title: 'Lyon Wu',
    subtitle: 'Forget the Label',
    description: 'Astro.js and Tailwind CSS theme for blog and portfolio by justgoodui.com',
    image: {
        src: '/dante-preview.jpg',
        alt: 'Dante - Astro.js and Tailwind CSS theme'
    },
    headerNavLinks: [
        {
            text: 'Home',
            href: '/'
        },
        // {
        //     text: 'Projects',
        //     href: '/projects'
        // },
        {
            text: 'Blog',
            href: '/blog'
        },
        {
            text: 'Tags',
            href: '/tags'
        }
    ],
    footerNavLinks: [
        {
            text: 'About',
            href: '/about'
        },
        {
            text: 'Contact',
            href: '/contact'
        }
        // {
        //     text: 'Terms',
        //     href: '/terms'
        // }
    ],
    socialLinks: [
        {
            text: 'Zhihu',
            href: 'https://www.zhihu.com/people/littlelyon'
        },
        {
            text: 'SegmentFault',
            href: 'https://segmentfault.com/u/littlelyon'
        },
        {
            text: 'GitHub',
            href: 'https://github.com/haoliangwu'
        }
    ],
    hero: {
        // title: 'Hi, 我是 haoliang.wu, 一名专注于 Web 领域的全栈工程师。',
        // text: '在 Web 领域，我拥有丰富的实战经验，可以针对各种实际问题给予切实可行的解决方案和建议。在运维、性能和安全方面，我也拥有宝贵的实践经验和必要知识，同时一直致力于编写可扩展、高可用、可维护和健壮的应用程序和模块，为我的团队创造价值。我热衷于探索新技术，不断学习并与团队不断成长，致力于创造更好的用户体验和业务价值。同时我坚信，华丽的跌倒，胜过无谓的徘徊。不忘初心，方得始终。',
        // image: {
        //     src: '/hero.jpeg',
        //     alt: 'A person sitting at a desk in front of a computer'
        // },
        // actions: [
        //     {
        //         text: 'Get in Touch',
        //         href: '/contact'
        //     }
        // ]
    },
    // subscribe: {
    //     title: 'Subscribe to Dante Newsletter',
    //     text: 'One update per week. All the latest posts directly in your inbox.',
    //     formUrl: '#'
    // },
    postsPerPage: 8
    // projectsPerPage: 8
};

export default siteConfig;
