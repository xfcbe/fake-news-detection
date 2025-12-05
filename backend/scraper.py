from newspaper import Article

def extract_text_from_url(url):
    try:
        article = Article(url)
        article.download()
        article.parse()
        
        return {
            "title": article.title,
            "text": article.text
        }
    except Exception as e:
        return None
