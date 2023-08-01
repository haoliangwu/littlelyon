const YEAR = new Date().getFullYear();

export default {
  head: ({ title, meta: _meta }) => {
    const meta = {
      ..._meta,
      title: "Lyon Wu",
      description: "Forget the label.",
      image: "https://www.littlelyon.com/logo.png",
    };

    return (
      <>
        <meta name="robots" content="follow, index" />
        <meta name="description" content={meta.description} />
        <meta property="og:site_name" content={meta.title} />
        <meta property="og:description" content={meta.description} />
        <meta property="og:title" content={meta.title} />
        <meta property="og:image" content={meta.image} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@littlelyon" />
        <meta name="twitter:title" content={meta.title} />
        <meta name="twitter:description" content={meta.description} />
        <meta name="twitter:image" content={meta.image} />
        <link
          rel="alternate"
          type="application/rss+xml"
          title="RSS"
          href="/feed.xml"
        />
        <link
          rel="preload"
          href="/fonts/Inter-roman.latin.var.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link rel="stylesheet" href="/styles/main.css" />
      </>
    );
  },
  footer: (
    <>
      <style jsx>{`
        a {
          float: right;
          margin-left: 0.5em;
        }
        @media screen and (max-width: 480px) {
          article {
            padding-top: 2rem;
            padding-bottom: 4rem;
          }
        }
      `}</style>
      <small style={{ display: "block", marginTop: "8rem" }}>
        <time>{YEAR}</time> © Lyon Wu
        <a href="/feed.xml">RSS</a>
      </small>
      <small style={{ display: "block", marginTop: "0.25rem" }}>
        <a href="https://beian.miit.gov.cn/#/Integrated/index" target="_blank">
          辽ICP备18006375号-1
        </a>
      </small>
    </>
  ),
  navs: [
    // todo: other links
    // {
    //   url: "https://github.com/shuding/nextra",
    //   name: "Nextra",
    // },
  ],
};
