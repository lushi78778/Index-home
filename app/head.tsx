export default function Head() {
  return (
    <>
      {/* 为 giscus 做连接预热，减少首帧握手时间 */}
      <link rel="preconnect" href="https://giscus.app" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="//giscus.app" />
    </>
  )
}
