import { Source } from "../sources/Source";
import cheerio from "cheerio";
import { APIWrapper } from "../API";
import { JaiminisBox } from "../sources/JaiminisBox/JaiminisBox";

describe("JaiminisBox Tests", function () {
  var wrapper: APIWrapper = new APIWrapper();
  var source: Source = new JaiminisBox(cheerio);
  var chai = require("chai"),
    expect = chai.expect,
    should = chai.should();
  var chaiAsPromised = require("chai-as-promised");
  chai.use(chaiAsPromised);

  /**
   * The Manga ID which this unit test uses to base it's details off of.
   * Try to choose a manga which is updated frequently, so that the historical checking test can
   * return proper results, as it is limited to searching 30 days back due to extremely long processing times otherwise.
   */
  var mangaId = "fire-force";

  it("Retrieve Manga Details", async () => {
    let details = await wrapper.getMangaDetails(source, [mangaId]);

    expect(
      details,
      "No results found with test-defined ID [" + mangaId + "]"
    ).to.be.an("array");
    expect(details).to.not.have.lengthOf(0, "Empty response from server");

    // Validate that the fields are filled
    let data = details[0];
    expect(data.id, "Missing ID").to.be.not.empty;
    expect(data.image, "Missing Image").to.be.not.empty;
    expect(data.status, "Missing Status").to.exist;
    expect(data.author, "Missing Author").to.be.not.empty;
    expect(data.desc, "Missing Description").to.be.not.empty;
    expect(data.titles, "Missing Titles").to.be.not.empty;
    expect(data.rating, "Missing Rating").to.exist;
  });

  it("Get Chapters", async () => {
    let data = await wrapper.getChapters(source, mangaId);

    expect(data, "No chapters present for: [" + mangaId + "]").to.not.be.empty;
  });

  it("Get Chapter Details", async () => {
    let chapters = await wrapper.getChapters(source, mangaId);

    let data = await wrapper.getChapterDetails(source, mangaId, chapters[0].id);

    expect(data, "No server response").to.exist;
    expect(data, "Empty server response").to.not.be.empty;

    expect(data.id, "Missing ID").to.be.not.empty;
    expect(data.mangaId, "Missing MangaID").to.be.not.empty;
    expect(data.pages, "No pages present").to.be.not.empty;
  });

  // Removed search test because it works in-app
  // it("Testing search", async () => {
  //   let testSearch = createSearchRequest({
  //     title: "fire force",
  //   });

  //   let search = await wrapper.search(source, testSearch, 0);

  //   let result = search[0];

  //   expect(result, "No response from server").to.exist;

  //   expect(result.id, "No ID found for search query").to.be.not.empty;
  //   expect(result.image, "No image found for search").to.be.not.empty;
  //   expect(result.title, "No title").to.be.not.null;
  // });

  // it("Testing invalid search", async () => {
  //   let testSearch = createSearchRequest({
  //     title: "very-not-valid-search",
  //   });

  //   let search = await wrapper.search(source, testSearch, 1);
  //   let result = search[0];

  //   expect(result, "No response from server").to.not.exist;
  // });
});
