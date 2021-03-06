import { Source } from "../Source";
import { Manga, MangaStatus } from "../../models/Manga/Manga";
import { Chapter } from "../../models/Chapter/Chapter";
import { MangaTile } from "../../models/MangaTile/MangaTile";
import { SearchRequest } from "../../models/SearchRequest/SearchRequest";
import { Request } from "../../models/RequestObject/RequestObject";
import { ChapterDetails } from "../../models/ChapterDetails/ChapterDetails";
import { LanguageCode } from "../../models/Languages/Languages";

const JB_DOMAIN = "https://jaiminisbox.com";

export class JaiminisBox extends Source {
  constructor(cheerio: CheerioAPI) {
    super(cheerio);
  }

  get version(): string {
    return "1.5.0";
  }

  get name(): string {
    return "Jaiminis Box";
  }

  get icon(): string {
    return "icon.png";
  }

  get author(): string {
    return "Meliodas";
  }

  get authorWebsite(): string {
    return "https://github.com/SungJinWoo-SL";
  }

  get description(): string {
    return "Extension that pulls manga from JaminisBox.";
  }

  get hentaiSource(): boolean {
    return false;
  }

  getMangaDetailsRequest(ids: string[]): Request[] {
    let requests: Request[] = [];
    for (let id of ids) {
      requests.push(
        createRequestObject({
          url: `${JB_DOMAIN}/reader/series/${id}`,
          method: "GET",
          metadata: { id },
        })
      );
    }
    return requests;
  }

  getMangaDetails(data: any, metadata: any): Manga[] {
    let mangas: Manga[] = [];

    let $ = this.cheerio.load(data);

    let raw = $('div[class="info"]')
      .text()
      .trim()
      .split(/(\w*Author\w*|\w*Artist\w*|\w*Synopsis\w*)+:/g);
    raw.shift();

    let cover = $(".thumbnail").find("img").attr("src") ?? "";
    let title = $("h1.title").text().trim();
    let rating = "0";
    let author = raw[1].trim();
    let artist = raw[3].trim();
    let isAdult = false;
    let description = raw[5].trim();
    let status = MangaStatus.ONGOING;
    let titles = [];
    titles.push(title!);

    mangas.push(
      createManga({
        id: metadata.id,
        titles: titles,
        image: cover!,
        rating: Number(rating),
        status: status,
        author: author!,
        artist: artist,
        tags: [],
        desc: description!,
        hentai: isAdult,
      })
    );

    return mangas;
  }

  getChaptersRequest(mangaId: string): Request {
    return createRequestObject({
      url: `${JB_DOMAIN}/reader/series/${mangaId}`,
      method: "GET",
      metadata: { mangaId },
    });
  }

  getChapters(data: any, metadata: any): Chapter[] {
    let $ = this.cheerio.load(data);
    let chapters: Chapter[] = [];

    for (let element of $("div.element").toArray()) {
      let hasVolumes = $("div.title", element.parent)
        .text()
        .toLowerCase()
        .includes("volume");

      let title = $("div.title a", element).attr("title");
      let date = new Date(Date.parse($("div.meta_r", element).html() ?? ""));
      let chapterIdRaw = $("div.title a", element).attr("href")?.split("/");
      let chapterIdClean = chapterIdRaw?.filter((i) => {
        return i != "" && i != null;
      });
      let chapterId = "";
      if (chapterIdClean && chapterIdClean.length > 1) {
        chapterId = chapterIdClean.pop()!.toString();
      }
      let chapterNumber = parseInt(chapterId) ?? 0;
      let volume = hasVolumes
        ? parseInt(
            $("div.title", element.parent).text().match(/\d+/g)![0].toString()
          )
        : parseInt(chapterId) ?? 0;

      chapters.push(
        createChapter({
          id: chapterId,
          mangaId: metadata.mangaId,
          time: date,
          name: title,
          langCode: LanguageCode.ENGLISH,
          chapNum: chapterNumber,
          volume: volume,
        })
      );
    }

    return chapters;
  }

  getChapterDetailsRequest(mangaId: string, chapId: string): Request {
    return createRequestObject({
      url: `${JB_DOMAIN}/reader/api/reader/chapter?comic_stub=${mangaId}&chapter=${chapId}`,
      method: "GET",
      metadata: { mangaId, chapId },
    });
  }

  getChapterDetails(data: any, metadata: any): ChapterDetails {
    let pages = JSON.parse(JSON.stringify(data))["pages"];

    let pageList: string[] = [];

    for (let page of pages) {
      pageList.push(page.url);
    }

    let chapterDetails = createChapterDetails({
      id: metadata.chapId,
      mangaId: metadata.mangaId,
      pages: pageList,
      longStrip: false,
    });

    return chapterDetails;
  }

  searchRequest(query: SearchRequest, page: number): Request | null {
    return createRequestObject({
      url: `${JB_DOMAIN}/reader/search`,
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      data: {
        search: query.title?.replace(" ", "%20"),
      },
    });
  }

  search(data: any): MangaTile[] | null {
    let $ = this.cheerio.load(data);

    let mangas: MangaTile[] = [];

    if ($("div.group").toArray().length <= 0) {
      return mangas;
    }

    $("div.group").each((index, manga) => {
      let chapterIdRaw = $("div.title a", manga).attr("href")?.split("/");
      let chapterIdClean = chapterIdRaw?.filter((i) => {
        return i != "" && i != null;
      });
      let chapterId = "";
      if (chapterIdClean && chapterIdClean.length > 1) {
        chapterId = chapterIdClean.pop()!.toString();
      }
      let title = $("div.title a", manga).attr("title");
      /* let lastUpdate = new Date(
        Date.parse($("div.meta_r", manga).html() ?? "")
      ).toLocaleDateString(); */

      mangas.push(
        createMangaTile({
          id: chapterId,
          image: "https://via.placeholder.com/300x448.png",
          title: createIconText({ text: title ?? "" }),
        })
      );
    });

    return mangas;
  }
}
