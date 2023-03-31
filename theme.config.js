const YEAR = new Date().getFullYear()

export default {
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
      <small style={{ display: 'block', marginTop: '8rem' }}>
        <time>{YEAR}</time> © Lyon Wu
        <a href="/feed.xml">RSS</a>
      </small>
      <small style={{ display: 'block', marginTop: '0.25rem' }}>
        <a href="https://beian.miit.gov.cn/#/Integrated/index" target="_blank">
          辽ICP备18006375号-1
        </a>
      </small>
    </>
  )
}
