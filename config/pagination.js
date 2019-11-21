module.exports = () => {
    await Product.find(async (err, docs) => {
        if (parseInt(docs.length % 10) == 0 && parseInt(docs.length / 10) > 0) {
          totalLength = await parseInt(docs.length / 10)
        } else if (parseInt(docs.length / 10) == 0) {
          totalLength = 1
        } else if (parseInt(docs.length % 10) != 0) {
          totalLength = await parseInt((docs.length / 10) + 1)
        }
        res.locals.totalPagination = await totalLength
      })
}