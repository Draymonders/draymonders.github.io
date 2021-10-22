# Diff脚本

## 背景

经常需要比对新旧版本的数据

## 实现

```python3
"""
    diff数据
"""
import csv

# 读取excel第几列数据，并做去重处理，返回的是 list(str)
def read(file, col):
    contents = []
    with open(file, "r") as f:
        f_csv = csv.reader(f)
        headers = next(f_csv)
        for csv_line in f_csv:
            s = str(csv_line[col]).strip()
            contents.append(s)

    contents = list(set(contents))
    return contents

# 在ori_data，不在dest_data的数据
def diff(ori_data, dest_data):
    return list(set([x for x in ori_data if x not in dest_data]))

# diff数据写入
def write_diff(file, not_in_tcs_data):
    headers = ["not_in_tcs"]
    rows = [(data,) for data in not_in_tcs_data]
    # print(rows[:3])
    with open(file,'w') as f:
        f_csv = csv.writer(f, headers)
        f_csv.writerow(headers)
        f_csv.writerows(rows)

# dates = ["09-19","09-20","09-21"]
# dates = ["09-23"]
# for date in dates:
#     ecqc_data = read("./{}/ecqc.csv".format(date), 1)
#     tcs_data = read("./{}/tcs.csv".format(date), 1)
#     not_in_tcs_data = diff(ecqc_data, tcs_data)
#     print("date:{} len: {}".format(date, len(not_in_tcs_data)))
#     write_diff("./{}/not_in_tcs.csv".format(date), not_in_tcs_data)
```