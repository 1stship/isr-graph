import React from 'react';
import { Line } from 'react-chartjs-2';
import AWS, { TimestreamQuery } from 'aws-sdk'

const colors = ['red', 'blue', 'green', 'orange', 'purple', 'yellow']

function Graph( { graphData } ) {
  const datasets = Object.keys(graphData.data).map((key, index) => {
    return {
      label: key,
      fill: false,
      showLine: true,
      lineTension: 0,
      borderColor: colors[index % colors.length],
      data: graphData.data[key]
    }
  })

  const data = {
    labels: ['Line'],
    datasets: datasets
  };  

  return (
    <div>
      <div>グラフ {graphData.time.build}</div>
      <Line
        data={data}
        width={400}
        height={100}
        options={{
          animation: false,
          scales: { xAxes: [{
            type: "time",
            distribution: "linear",
            ticks: {
              min: graphData.time.min,
              max: graphData.time.max
            }
          }]},
        }}
      />
    </div>
  );
};

export async function getStaticProps() {
  const client = new AWS.TimestreamQuery({
    region: "us-east-1",
    credentials: {
      accessKeyId: process.env.ACCESS_KEY_ID,
      secretAccessKey: process.env.SECRET_ACCESS_KEY
    }
  });

  const params = {
    QueryString: 'select measure_name, time, measure_value::double from "soracom"."gpsmultiunit" where time > ago(60m) order by time asc'
  }

  var i = 0;
  const graphData = { time: { build: new Date().toString()}, data: {}};
  await client.query(params).promise()
  .then(
    (response) => {
      response.Rows.forEach(row => {
        if (!graphData.data.hasOwnProperty(row.Data[0].ScalarValue)){
          graphData.data[row.Data[0].ScalarValue] = []
        }
        graphData.data[row.Data[0].ScalarValue].push({x: row.Data[1].ScalarValue, y: row.Data[2].ScalarValue})
      })
      graphData.time.min = response.Rows[0].Data[1].ScalarValue
      graphData.time.max = response.Rows[response.Rows.length - 1].Data[1].ScalarValue
    },
    (err) => {
      console.error("Error while querying: ", err);
    }
  )

  return {
    props: {
      graphData
    },
    revalidate: 60
  }
}

export default Graph