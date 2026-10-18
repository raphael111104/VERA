param([Parameter(Mandatory=$true)][string]$InputPath)
$ErrorActionPreference='Stop'
$word=$null
$document=$null
function Normalize-Quote([string]$text) {
    $code=$false
    $lines=foreach($line in ($text -split '\r?\n')) {
        if($line.Trim().StartsWith('```')){$code=-not $code;continue}
        if($code){$line}else{([regex]::Replace($line,'^#{1,6}\s+','')).Replace('**','').Replace('*','')}
    }
    [regex]::Replace(($lines -join "`n"),'[\s\u0007]+',' ').Trim()
}
try {
    $word=New-Object -ComObject Word.Application
    $word.Visible=$false
    $word.DisplayAlerts=0
    $word.AutomationSecurity=3
    $document=$word.Documents.Open($InputPath,$false,$true)
    $document.Repaginate()
    $pages=@{}
    foreach($bookmark in $document.Bookmarks) {
        if($bookmark.Name.StartsWith('vera_')) { $pages[$bookmark.Name]=[int]$bookmark.Range.Information(3) }
    }
    $locatorPath=[IO.Path]::ChangeExtension($InputPath,'.locators.json')
    if(Test-Path -LiteralPath $locatorPath) {
        # Windows PowerShell 5.1 preserves a JSON array as one pipeline object.
        # Do not wrap that array again: each locator must be processed separately.
        $locators=Get-Content -LiteralPath $locatorPath -Raw -Encoding UTF8|ConvertFrom-Json
        foreach($locator in $locators) {
            $result=@{status='needs_review';startPage=$null;endPage=$null;reason='Kutipan tidak ditemukan secara unik dalam bagian hasil render'}
            $sectionStart=$null
            $sectionEnd=[int]$document.Content.End
            if($locator.sectionBookmark -and $document.Bookmarks.Exists([string]$locator.sectionBookmark)) {
                $sectionStart=[int]$document.Bookmarks.Item([string]$locator.sectionBookmark).Range.End
                foreach($b in $document.Bookmarks){$position=[int]$b.Range.Start;if($position -gt $sectionStart -and $position -lt $sectionEnd){$sectionEnd=$position}}
            } elseif($locator.heading) {
                foreach($paragraph in $document.Paragraphs) {
                    if([int]$paragraph.Range.ParagraphFormat.OutlineLevel -eq 1) {
                        if($null -ne $sectionStart) {$sectionEnd=[int]$paragraph.Range.Start;break}
                        if($paragraph.Range.Text.Trim() -eq [string]$locator.heading){$sectionStart=[int]$paragraph.Range.End}
                    }
                }
            }
            $quote=Normalize-Quote ([string]$locator.quote)
            if($null -ne $sectionStart -and $quote.Length -gt 0 -and $sectionEnd -gt $sectionStart) {
                $scope=$document.Range($sectionStart,$sectionEnd)
                $normalized=[regex]::Replace([string]$scope.Text,'[\s\u0007]+',' ').Trim()
                $count=[regex]::Matches($normalized,[regex]::Escape($quote)).Count
                if($count -eq 1) {
                    $first=([string]$locator.quote -split '\r?\n'|Where-Object {$_.Trim().Length -gt 0 -and -not $_.Trim().StartsWith('```')}|Select-Object -First 1)
                    $needle=Normalize-Quote $first
                    if($needle.Length -gt 80){$needle=$needle.Substring(0,80)}
                    $search=$document.Range($sectionStart,$sectionEnd)
                    $search.Find.MatchCase=$true
                    $search.Find.MatchWildcards=$false
                    $search.Find.Wrap=0
                    for($attempt=0;$attempt -lt 16;$attempt++) {
                        if(-not $search.Find.Execute($needle)){break}
                        $foundStart=[int]$search.Start
                        $tailEnd=[Math]::Min($sectionEnd,$foundStart+[Math]::Max(2048,$quote.Length*3))
                        $tail=[string]$document.Range($foundStart,$tailEnd).Text
                        $buffer=[Text.StringBuilder]::new()
                        $endOffset=0
                        $space=$false
                        for($i=0;$i -lt $tail.Length;$i++) {
                            $character=$tail[$i]
                            if([char]::IsWhiteSpace($character) -or [int]$character -eq 7) {if(-not $space){[void]$buffer.Append(' ')};$space=$true}
                            else {[void]$buffer.Append($character);$space=$false}
                            if($buffer.ToString().Trim().Length -ge $quote.Length){$endOffset=$i+1;break}
                        }
                        if($buffer.ToString().Trim() -eq $quote -and $endOffset -gt 0) {
                            $range=$document.Range($foundStart,$foundStart+$endOffset)
                            $startRange=$range.Duplicate
                            $startRange.Collapse(1)
                            $endRange=$range.Duplicate
                            $endRange.Collapse(0)
                            $result=@{status='rendered_quote';startPage=[int]$startRange.Information(3);endPage=[int]$endRange.Information(3);reason='Kutipan unik diperiksa dalam bagian dokumen hasil render'}
                            break
                        }
                        $next=[int]$search.End
                        if($next -ge $sectionEnd){break}
                        $search=$document.Range($next,$sectionEnd)
                        $search.Find.MatchCase=$true
                        $search.Find.MatchWildcards=$false
                        $search.Find.Wrap=0
                    }
                }
            }
            $pages[[string]$locator.id]=$result
        }
    }
    $pages['_pageCount']=[int]$document.ComputeStatistics(2)
    $document.ExportAsFixedFormat([IO.Path]::ChangeExtension($InputPath,'.pdf'),17)
    [IO.File]::WriteAllText([IO.Path]::ChangeExtension($InputPath,'.pages.json'),($pages|ConvertTo-Json -Depth 8 -Compress),[Text.UTF8Encoding]::new($false))
} finally {
    if($null -ne $document) { $document.Close(0) }
    if($null -ne $word) { $word.Quit() }
}
