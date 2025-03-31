async function getTotal(query, exclude, url, date) {
  const excludeQuery = exclude.map(word => `-${word}`).join(" ");
  const fullQuery = `${query} ${excludeQuery} ${date}`;

  const params = new URLSearchParams({
    query: fullQuery,
    display: "1",
    start: "1",
    sort: "date",
  });

  const finalUrl = `${url}?${params.toString()}`;
  console.log("🔍 요청 URL:", finalUrl);

  try {
    const response = await fetch(finalUrl, {
      method: "GET",
      headers: {
        "X-Naver-Client-Id": process.env.NAVER_CLIENT_ID_2,
        "X-Naver-Client-Secret": process.env.NAVER_CLIENT_SECRET_2,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("❌ 네이버 응답 오류:", response.status, text);
      return 0;
    }

    const json = await response.json();
    return json.total || 0;
  } catch (err) {
    console.error("⚠️ getTotal 에러:", err.message);
    return 0;
  }
}