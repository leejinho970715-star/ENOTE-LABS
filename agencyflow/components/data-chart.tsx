import { chartCardHTML, type ChartSeries, type ChartOptions } from '../../demos/weekly-report/charts.js';
export default function DataChart({title,series,...options}:{title:string;series:ChartSeries[]}&ChartOptions) {
  // The shared renderer escapes every label, title and note; only finite numeric styles are emitted.
  return <div dangerouslySetInnerHTML={{__html:chartCardHTML(title,series,options)}} />;
}
